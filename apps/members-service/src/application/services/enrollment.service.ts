import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import {
    type EnrollProgressPayload,
    type EnrollmentMqttPort,
} from '../ports/enrollment-mqtt.port';
import { type MemberRepositoryPort } from '../ports/member-repository.port';

export interface EnrollmentSession {
    memberId: string;
    fingerprintId: number;
    deviceId: string;
    step: EnrollmentStep;
    status: EnrollmentStatus;
    message: string;
    startedAt: number;
    updatedAt: number;
}

export type EnrollmentStep =
    | 'starting'
    | 'place_finger'
    | 'remove_finger'
    | 'place_again'
    | 'building'
    | 'done'
    | 'delete';

export type EnrollmentStatus =
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'timeout';

const SESSION_TIMEOUT_MS = 60_000;
const SESSION_RETENTION_MS = 30_000;
const MAX_FINGERPRINT_SLOT = 1000;

@Injectable()
export class EnrollmentService implements OnModuleInit {
    private readonly logger = new Logger(EnrollmentService.name);
    private sessions = new Map<string, EnrollmentSession>();

    constructor(
        @Inject('MemberRepositoryPort')
        private readonly memberRepository: MemberRepositoryPort,
        @Inject('EnrollmentMqttPort')
        private readonly mqtt: EnrollmentMqttPort,
    ) {}

    onModuleInit(): void {
        this.mqtt.onEnrollProgress((progress) =>
            this.handleProgress(progress),
        );
    }

    async startEnrollment(
        memberId: string,
        deviceId: string,
    ): Promise<EnrollmentSession> {
        const member = await this.memberRepository.findById(memberId);
        if (!member) {
            throw new NotFoundException(`Miembro ${memberId} no existe`);
        }

        const existing = this.sessions.get(memberId);
        if (
            existing &&
            existing.status === 'in_progress' &&
            Date.now() - existing.updatedAt < SESSION_TIMEOUT_MS
        ) {
            throw new ConflictException(
                'Ya hay un enrolamiento en curso para este miembro',
            );
        }

        let fingerprintId = member.fingerprintId;
        if (!fingerprintId) {
            fingerprintId = await this.findNextFreeSlot();
        }

        const session: EnrollmentSession = {
            memberId,
            fingerprintId,
            deviceId,
            step: 'starting',
            status: 'in_progress',
            message: 'Esperando dispositivo',
            startedAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.sessions.set(memberId, session);

        this.mqtt.publishEnrollRequest({
            member_id: memberId,
            fingerprint_id: fingerprintId,
            device_id: deviceId,
        });

        return session;
    }

    getSession(memberId: string): EnrollmentSession | null {
        const session = this.sessions.get(memberId);
        if (!session) return null;
        if (
            session.status === 'in_progress' &&
            Date.now() - session.updatedAt > SESSION_TIMEOUT_MS
        ) {
            session.status = 'timeout';
            session.step = 'done';
            session.message = 'Tiempo agotado';
            session.updatedAt = Date.now();
        }
        return session;
    }

    cancelSession(memberId: string): void {
        const session = this.sessions.get(memberId);
        if (!session) return;
        if (session.status !== 'in_progress') return;
        session.status = 'failed';
        session.step = 'done';
        session.message = 'Cancelado por el administrador';
        session.updatedAt = Date.now();
    }

    async deleteFingerprint(
        memberId: string,
        deviceId: string,
    ): Promise<void> {
        const member = await this.memberRepository.findById(memberId);
        if (!member) {
            throw new NotFoundException(`Miembro ${memberId} no existe`);
        }
        if (!member.fingerprintId) {
            throw new BadRequestException(
                'El miembro no tiene huella registrada',
            );
        }

        this.mqtt.publishEnrollDelete({
            member_id: memberId,
            fingerprint_id: member.fingerprintId,
            device_id: deviceId,
        });

        await this.memberRepository.setFingerprintId(memberId, null);
        this.sessions.delete(memberId);
    }

    private async findNextFreeSlot(): Promise<number> {
        const used = new Set(
            await this.memberRepository.findUsedFingerprintIds(),
        );
        for (let slot = 1; slot <= MAX_FINGERPRINT_SLOT; slot++) {
            if (!used.has(slot)) {
                return slot;
            }
        }
        throw new ConflictException(
            'No hay slots de huella disponibles (sensor lleno)',
        );
    }

    private handleProgress(payload: EnrollProgressPayload): void {
        const session = this.sessions.get(payload.member_id);
        if (!session) {
            this.logger.debug(
                `Progress recibido sin sesión activa para member ${payload.member_id}`,
            );
            return;
        }
        if (session.deviceId !== payload.device_id) {
            this.logger.debug(
                `Progress de device ${payload.device_id} ignorado (sesión activa en ${session.deviceId})`,
            );
            return;
        }
        if (session.fingerprintId !== payload.fingerprint_id) {
            this.logger.debug(
                `Progress con fingerprint_id distinto, ignorado`,
            );
            return;
        }

        session.step = payload.step as EnrollmentStep;
        session.message = payload.message;
        session.updatedAt = Date.now();

        if (payload.status === 'success' && payload.step === 'done') {
            session.status = 'success';
            void this.persistFingerprintId(
                session.memberId,
                session.fingerprintId,
            );
        } else if (payload.status === 'failed') {
            session.status = 'failed';
        } else if (payload.status === 'in_progress') {
            session.status = 'in_progress';
        }

        this.scheduleCleanup(session.memberId);
    }

    private async persistFingerprintId(
        memberId: string,
        fingerprintId: number,
    ): Promise<void> {
        try {
            await this.memberRepository.setFingerprintId(
                memberId,
                fingerprintId,
            );
        } catch (error) {
            this.logger.error(
                `Error persistiendo fingerprint_id ${fingerprintId} para ${memberId}: ${(error as Error).message}`,
            );
        }
    }

    private scheduleCleanup(memberId: string): void {
        const session = this.sessions.get(memberId);
        if (!session) return;
        if (session.status === 'in_progress') return;

        setTimeout(() => {
            const current = this.sessions.get(memberId);
            if (
                current &&
                current.status !== 'in_progress' &&
                Date.now() - current.updatedAt >= SESSION_RETENTION_MS - 100
            ) {
                this.sessions.delete(memberId);
            }
        }, SESSION_RETENTION_MS);
    }
}
