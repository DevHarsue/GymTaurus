import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateCompliantPassword } from '@libs/common';
import { CreateMemberDto } from '../../api/dtos/create-member.dto';
import { UpdateMemberDto } from '../../api/dtos/update-member.dto';
import { CompleteProfileDto } from '../../api/dtos/complete-profile.dto';
import {
    FindAllMembersOptions,
    PaginatedResult,
    type MemberModel,
    type MemberWithStatus,
    type MemberRepositoryPort,
} from '../ports/member-repository.port';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import { type AuthServicePort } from '../ports/auth-service.port';

@Injectable()
export class MembersService {
    constructor(
        @Inject('MemberRepositoryPort')
        private readonly memberRepository: MemberRepositoryPort,
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
        @Inject('AuthServicePort')
        private readonly authService: AuthServicePort,
    ) {}

    async createMember(
        payload: CreateMemberDto,
        createdBy: string,
    ): Promise<MemberModel & { temporaryPassword?: string }> {
        const existing = await this.memberRepository.findByCedula(payload.cedula);
        if (existing) {
            throw new ConflictException(`Member with cedula ${payload.cedula} already exists`);
        }

        // Validar fingerprint_id antes de llamar a auth-service.
        // Si no se valida aqui, auth crea el user y despues falla el INSERT
        // por la constraint unica, dejando un usuario huerfano en auth.
        if (payload.fingerprintId !== undefined) {
            const fingerprintTaken = await this.memberRepository.findByFingerprintId(
                payload.fingerprintId,
            );
            if (fingerprintTaken) {
                throw new ConflictException(
                    `El fingerprint_id ${payload.fingerprintId} ya esta asignado a otro miembro`,
                );
            }
        }

        const generatedPassword = payload.password ? undefined : generateCompliantPassword(12);
        const password = payload.password ?? generatedPassword!;

        const registeredUser = await this.authService.register(payload.email, password);

        const member = await this.memberRepository.create({
            userId: registeredUser.id,
            createdBy,
            name: payload.name,
            cedula: payload.cedula,
            email: payload.email,
            phone: payload.phone,
            fingerprintId: payload.fingerprintId,
        });

        await this.cache.set(`member:${member.id}`, JSON.stringify(member), 300);
        await this.eventPublisher.publish('members.member.created', member);
        return { ...member, temporaryPassword: generatedPassword };
    }

    async getMember(id: string): Promise<MemberModel | null> {
        const cached = await this.cache.get(`member:${id}`);
        if (cached) {
            return JSON.parse(cached) as MemberModel;
        }

        const member = await this.memberRepository.findById(id);
        if (member) {
            await this.cache.set(`member:${id}`, JSON.stringify(member), 300);
        }
        return member;
    }

    async getMemberByUserId(userId: string): Promise<MemberModel | null> {
        return this.memberRepository.findByUserId(userId);
    }

    async listMembers(options: FindAllMembersOptions): Promise<PaginatedResult<MemberWithStatus>> {
        return this.memberRepository.findAll(options);
    }

    async completeMyProfile(userId: string, payload: CompleteProfileDto): Promise<MemberModel> {
        const member = await this.memberRepository.findByUserId(userId);
        if (!member) {
            throw new NotFoundException('No existe un perfil de miembro asociado a este usuario');
        }
        if (member.cedula) {
            throw new ConflictException('El perfil ya está completo');
        }

        const cedulaTaken = await this.memberRepository.findByCedula(payload.cedula);
        if (cedulaTaken) {
            throw new ConflictException(`La cédula ${payload.cedula} ya está registrada`);
        }

        const updated = await this.memberRepository.update(member.id, {
            cedula: payload.cedula,
            phone: payload.phone,
        });
        if (!updated) {
            throw new NotFoundException(`Miembro con ID ${member.id} no encontrado`);
        }
        await this.cache.set(`member:${updated.id}`, JSON.stringify(updated), 300);
        return updated;
    }

    async updateMember(id: string, payload: UpdateMemberDto): Promise<MemberModel> {
        const member = await this.memberRepository.update(id, payload);
        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        await this.cache.set(`member:${id}`, JSON.stringify(member), 300);
        return member;
    }

    async deleteMember(id: string): Promise<void> {
        const deleted = await this.memberRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        await this.cache.delete(`member:${id}`);
        await this.eventPublisher.publish('members.member.deleted', { id });
    }

    async findByFingerprintId(fingerprintId: number): Promise<MemberModel | null> {
        return this.memberRepository.findByFingerprintId(fingerprintId);
    }
}
