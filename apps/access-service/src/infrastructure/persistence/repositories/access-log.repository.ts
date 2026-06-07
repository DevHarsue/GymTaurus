import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    type AccessReason,
    type AccessLogModel,
    type AccessLogRepositoryPort,
    type CreateAccessLogInput,
    DuplicateAccessLogError,
} from '../../../application/ports/access-log-repository.port';
import { AccessLog } from '../schemas/access-log.schema';
import { AuditTrail } from '../schemas/audit-trail.schema';

@Injectable()
export class AccessLogRepository implements AccessLogRepositoryPort {
    constructor(
        @InjectModel(AccessLog.name)
        private readonly accessLogModel: Model<AccessLog>,
        @InjectModel(AuditTrail.name)
        private readonly auditTrailModel: Model<AuditTrail>,
    ) {}

    async create(payload: CreateAccessLogInput): Promise<AccessLogModel> {
        let accessLog;
        try {
            accessLog = await this.accessLogModel.create({
                member_id: payload.memberId,
                fingerprint_id: payload.fingerprintId,
                member_name: payload.memberName,
                granted: payload.granted,
                reason: payload.reason,
                device_id: payload.deviceId,
                timestamp: payload.timestamp,
                synced: payload.synced,
                checked_out_at: null,
                checkout_method: null,
                duration_minutes: null,
            });
        } catch (error) {
            // E11000: violacion del indice unico uniq_dedupe_sync.
            // Se lanza ANTES de insertar en audit_trail: los duplicados
            // de un re-envio del batch offline no se auditan.
            if ((error as { code?: number })?.code === 11000) {
                throw new DuplicateAccessLogError();
            }
            throw error;
        }

        await this.auditTrailModel.create({
            action: payload.granted ? 'access_granted' : 'access_denied',
            actor_id: null,
            actor_email: null,
            target_type: 'member',
            target_id: payload.memberId,
            details: {
                fingerprint_id: payload.fingerprintId,
                device_id: payload.deviceId,
                reason: payload.reason,
            },
            timestamp: payload.timestamp,
        });

        return {
            memberId: accessLog.member_id,
            fingerprintId: accessLog.fingerprint_id,
            memberName: accessLog.member_name,
            granted: accessLog.granted,
            reason: this.toAccessReason(accessLog.reason),
            deviceId: accessLog.device_id,
            timestamp: accessLog.timestamp,
        };
    }

    async listRecent(limit: number, offset: number): Promise<AccessLogModel[]> {
        const logs = await this.accessLogModel
            .find({})
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .lean()
            .exec();

        return logs.map((log) => ({
            memberId: log.member_id,
            fingerprintId: log.fingerprint_id,
            memberName: log.member_name,
            granted: log.granted,
            reason: this.toAccessReason(log.reason),
            deviceId: log.device_id,
            timestamp: log.timestamp,
        }));
    }

    async listByMember(memberId: string, limit: number, offset: number): Promise<AccessLogModel[]> {
        const logs = await this.accessLogModel
            .find({ member_id: memberId })
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit)
            .lean()
            .exec();

        return logs.map((log) => ({
            memberId: log.member_id,
            fingerprintId: log.fingerprint_id,
            memberName: log.member_name,
            granted: log.granted,
            reason: this.toAccessReason(log.reason),
            deviceId: log.device_id,
            timestamp: log.timestamp,
        }));
    }

    private toAccessReason(reason: string): AccessReason {
        if (
            reason === 'active' ||
            reason === 'expired' ||
            reason === 'not_found'
        ) {
            return reason;
        }

        return 'not_found';
    }
}
