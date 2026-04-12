import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { DEVICE_HEARTBEAT_QUEUE_NAME } from '../application/constants/device-heartbeat.constants';
import { MockMemberStatusService } from './integrations/mock-member-status.service';
import { AccessJobsScheduler } from './jobs/access-jobs.scheduler';
import { RedisCacheService } from './cache/redis-cache.service';
import { AccessProcessor } from './jobs/access.processor';
import { DeviceHeartbeatMonitorService } from './jobs/device-heartbeat-monitor.service';
import { RedisEventPublisher } from './messaging/redis-event-publisher';
import { AccessLogRepository } from './persistence/repositories/access-log.repository';
import {
    AccessLog,
    AccessLogSchema,
} from './persistence/schemas/access-log.schema';
import {
    AuditTrail,
    AuditTrailSchema,
} from './persistence/schemas/audit-trail.schema';

@Module({
    imports: [
        BullModule.registerQueue({ name: DEVICE_HEARTBEAT_QUEUE_NAME }),
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
            { name: AuditTrail.name, schema: AuditTrailSchema },
        ]),
    ],
    providers: [
        AccessLogRepository,
        RedisCacheService,
        RedisEventPublisher,
        MockMemberStatusService,
        AccessJobsScheduler,
        AccessProcessor,
        DeviceHeartbeatMonitorService,
        {
            provide: 'AccessLogRepositoryPort',
            useExisting: AccessLogRepository,
        },
        { provide: 'CachePort', useExisting: RedisCacheService },
        { provide: 'EventPublisherPort', useExisting: RedisEventPublisher },
        { provide: 'MemberStatusPort', useExisting: MockMemberStatusService },
    ],
    exports: [
        'AccessLogRepositoryPort',
        'CachePort',
        'EventPublisherPort',
        'MemberStatusPort',
    ],
})
export class InfrastructureModule {}
