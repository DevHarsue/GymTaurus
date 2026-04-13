import { Injectable } from '@nestjs/common';
import {
    type MemberStatusModel,
    type MemberStatusPort,
} from '../../application/ports/member-status.port';

interface MemberStatusResponse {
    id: string;
    name: string;
    active: boolean;
    daysLeft?: number;
    days_left?: number;
    fingerprintId?: number;
}

@Injectable()
export class MembersHttpStatusService implements MemberStatusPort {
    private readonly baseUrl =
        process.env.MEMBERS_SERVICE_BASE_URL ?? 'http://members-service:3001';

    async findByFingerprint(
        fingerprintId: number,
    ): Promise<MemberStatusModel | null> {
        const response = await fetch(
            `${this.baseUrl}/members/by-fingerprint/${fingerprintId}`,
        );

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(
                `members-service error ${response.status} for fingerprint ${fingerprintId}`,
            );
        }

        const raw = (await response.json()) as unknown;
        if (raw === null) {
            return null;
        }

        return this.parseResponse(raw, fingerprintId);
    }

    private parseResponse(
        raw: unknown,
        fallbackFingerprintId: number,
    ): MemberStatusModel {
        if (!raw || typeof raw !== 'object') {
            throw new Error('members-service returned invalid payload');
        }

        const candidate = raw as Partial<MemberStatusResponse>;
        const daysLeftRaw = candidate.daysLeft ?? candidate.days_left;
        const parsedFingerprintId =
            typeof candidate.fingerprintId === 'number'
                ? candidate.fingerprintId
                : fallbackFingerprintId;

        if (
            typeof candidate.id !== 'string' ||
            typeof candidate.name !== 'string' ||
            typeof candidate.active !== 'boolean' ||
            typeof daysLeftRaw !== 'number'
        ) {
            throw new Error('members-service response shape mismatch');
        }

        return {
            id: candidate.id,
            name: candidate.name,
            active: candidate.active,
            daysLeft: daysLeftRaw,
            fingerprintId: parsedFingerprintId,
        };
    }
}
