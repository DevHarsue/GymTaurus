import { Inject, Injectable, Logger } from '@nestjs/common';
import { type MqttAccessRequestDto } from '../../api/dtos/mqtt-access-request.dto';
import { type MqttAccessResponseDto } from '../../api/dtos/mqtt-access-response.dto';
import { type SyncAccessItemDto } from '../../api/dtos/sync-access-item.dto';
import {
    type AccessReason,
    type AccessLogRepositoryPort,
} from '../ports/access-log-repository.port';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import { type MemberStatusPort } from '../ports/member-status.port';

@Injectable()
export class AccessService {
    private static readonly UNKNOWN_MEMBER_ID =
        '00000000-0000-0000-0000-000000000000';
    private readonly logger = new Logger(AccessService.name);

    constructor(
        @Inject('AccessLogRepositoryPort')
        private readonly accessLogRepository: AccessLogRepositoryPort,
        @Inject('MemberStatusPort')
        private readonly memberStatusPort: MemberStatusPort,
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async processMqttAccessRequest(
        payload: MqttAccessRequestDto,
    ): Promise<MqttAccessResponseDto> {
        return this.processAccess({
            fingerprintId: payload.fingerprint_id,
            timestamp: payload.timestamp,
            deviceId: payload.device_id,
            synced: true,
        });
    }

    async syncBatch(items: SyncAccessItemDto[]): Promise<{
        processed: number;
        errors: number;
    }> {
        let processed = 0;
        let errors = 0;

        for (const item of items) {
            try {
                await this.processAccess({
                    fingerprintId: item.fingerprint_id,
                    timestamp: item.timestamp,
                    deviceId: item.device_id,
                    synced: false,
                });
                processed += 1;
            } catch (error) {
                errors += 1;
                const message =
                    error instanceof Error ? error.message : 'unknown error';
                this.logger.error(
                    `Error procesando item offline fingerprint=${item.fingerprint_id}: ${message}`,
                );
            }
        }

        return { processed, errors };
    }

    async listLogs(
        limit: number,
        offset: number,
    ): Promise<
        Array<{
            member_name: string;
            granted: boolean;
            reason: AccessReason;
            timestamp: string;
        }>
    > {
        const logs = await this.accessLogRepository.listRecent(limit, offset);
        return logs.map((log) => ({
            member_name: log.memberName,
            granted: log.granted,
            reason: log.reason,
            timestamp: log.timestamp.toISOString(),
        }));
    }

    private async processAccess(input: {
        fingerprintId: number;
        timestamp: string;
        deviceId: string;
        synced: boolean;
    }): Promise<MqttAccessResponseDto> {
        const timestamp = new Date(input.timestamp);
        const memberStatus = await this.memberStatusPort.findByFingerprint(
            input.fingerprintId,
        );
        const reason = this.resolveReason(memberStatus);
        const granted = reason === 'active';
        const memberName = memberStatus?.name ?? 'No encontrado';
        const memberId = memberStatus?.id ?? AccessService.UNKNOWN_MEMBER_ID;
        const daysLeft = memberStatus?.daysLeft ?? 0;

        const accessLog = await this.accessLogRepository.create({
            memberId,
            fingerprintId: input.fingerprintId,
            memberName,
            granted,
            reason,
            deviceId: input.deviceId,
            timestamp,
            synced: input.synced,
        });

        await this.cache.set(
            `access:last:${input.fingerprintId}`,
            JSON.stringify({
                granted,
                reason,
                timestamp: accessLog.timestamp.toISOString(),
                deviceId: input.deviceId,
            }),
            300,
        );

        await this.eventPublisher.publish('access:new', {
            memberId,
            memberName,
            granted,
            timestamp: accessLog.timestamp.toISOString(),
        });

        return {
            fingerprint_id: input.fingerprintId,
            granted,
            name: memberName,
            days_left: daysLeft,
            reason,
        };
    }

    private resolveReason(
        memberStatus: {
            active: boolean;
        } | null,
    ): AccessReason {
        if (!memberStatus) {
            return 'not_found';
        }

        if (!memberStatus.active) {
            return 'expired';
        }

        return 'active';
    }
}
