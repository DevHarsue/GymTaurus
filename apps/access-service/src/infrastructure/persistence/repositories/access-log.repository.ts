import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { type RegisterAccessDto } from '../../../api/dtos/register-access.dto';
import {
    type AccessLogModel,
    type AccessLogRepositoryPort,
} from '../../../application/ports/access-log-repository.port';
import { AccessLog } from '../schemas/access-log.schema';

@Injectable()
export class AccessLogRepository implements AccessLogRepositoryPort {
    constructor(
        @InjectModel(AccessLog.name)
        private readonly accessLogModel: Model<AccessLog>,
    ) {}

    async create(payload: RegisterAccessDto): Promise<AccessLogModel> {
        const accessLog = await this.accessLogModel.create({
            memberId: payload.memberId,
            fingerprintId: payload.fingerprintId,
            memberName: payload.memberName,
            granted: payload.granted,
            reason: payload.reason,
            deviceId: payload.deviceId,
            timestamp: payload.timestamp
                ? new Date(payload.timestamp)
                : new Date(),
            synced: true,
            checkedOutAt: null,
            checkoutMethod: null,
            durationMinutes: null,
        });

        return {
            memberId: accessLog.memberId,
            fingerprintId: accessLog.fingerprintId,
            memberName: accessLog.memberName,
            granted: accessLog.granted,
            reason: accessLog.reason,
            deviceId: accessLog.deviceId,
            timestamp: accessLog.timestamp,
        };
    }

    async listByMember(memberId: string): Promise<AccessLogModel[]> {
        const logs = await this.accessLogModel
            .find({ memberId })
            .sort({ timestamp: -1 })
            .lean()
            .exec();

        return logs.map((log) => ({
            memberId: log.memberId,
            fingerprintId: log.fingerprintId,
            memberName: log.memberName,
            granted: log.granted,
            reason: log.reason,
            deviceId: log.deviceId,
            timestamp: log.timestamp,
        }));
    }
}
