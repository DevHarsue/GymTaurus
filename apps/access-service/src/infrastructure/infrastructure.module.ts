import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisCacheService } from './cache/redis-cache.service';
import { AccessProcessor } from './jobs/access.processor';
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
        BullModule.registerQueue({ name: 'access-jobs' }),
        MongooseModule.forFeature([
            { name: AccessLog.name, schema: AccessLogSchema },
            { name: AuditTrail.name, schema: AuditTrailSchema },
        ]),
    ],
    providers: [
        AccessLogRepository,
        RedisCacheService,
        RedisEventPublisher,
        AccessProcessor,
        {
            provide: 'AccessLogRepositoryPort',
            useExisting: AccessLogRepository,
        },
        { provide: 'CachePort', useExisting: RedisCacheService },
        { provide: 'EventPublisherPort', useExisting: RedisEventPublisher },
    ],
    exports: ['AccessLogRepositoryPort', 'CachePort', 'EventPublisherPort'],
})
export class InfrastructureModule {}
