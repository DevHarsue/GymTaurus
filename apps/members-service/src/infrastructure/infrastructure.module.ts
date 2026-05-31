import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisEventPublisher } from './messaging/redis-event-publisher';
import { EnrollmentMqttGateway } from './messaging/enrollment-mqtt.gateway';
import { RedisCacheService } from './cache/redis-cache.service';
import { AuthHttpService } from './integrations/auth-http.service';
import { AuditLogEntity } from './persistence/entities/audit-log.entity';
import { DeviceEntity } from './persistence/entities/device.entity';
import { MemberEntity } from './persistence/entities/member.entity';
import { MembershipPlanEntity } from './persistence/entities/membership-plan.entity';
import { RenewalEntity } from './persistence/entities/renewal.entity';
import { SubscriptionEntity } from './persistence/entities/subscription.entity';
import { AuditLogRepository } from './persistence/repositories/audit-log.repository';
import { MemberRepository } from './persistence/repositories/member.repository';
import { PlanRepository } from './persistence/repositories/plan.repository';
import { SubscriptionRepository } from './persistence/repositories/subscription.repository';
import { StatisticsRepository } from './persistence/repositories/statistics.repository';
import { DeviceRepository } from './persistence/repositories/device.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MemberEntity,
            MembershipPlanEntity,
            SubscriptionEntity,
            RenewalEntity,
            DeviceEntity,
            AuditLogEntity,
        ]),
        BullModule.registerQueue({ name: 'members-jobs' }),
    ],
    providers: [
        MemberRepository,
        PlanRepository,
        SubscriptionRepository,
        StatisticsRepository,
        DeviceRepository,
        AuditLogRepository,
        RedisCacheService,
        RedisEventPublisher,
        AuthHttpService,
        EnrollmentMqttGateway,

        { provide: 'MemberRepositoryPort', useExisting: MemberRepository },
        { provide: 'PlanRepositoryPort', useExisting: PlanRepository },
        {
            provide: 'SubscriptionRepositoryPort',
            useExisting: SubscriptionRepository,
        },
        { provide: 'CachePort', useExisting: RedisCacheService },
        { provide: 'EventPublisherPort', useExisting: RedisEventPublisher },
        { provide: 'AuthServicePort', useExisting: AuthHttpService },
        { provide: 'EnrollmentMqttPort', useExisting: EnrollmentMqttGateway },
        { provide: 'StatisticsRepositoryPort', useExisting: StatisticsRepository },
        { provide: 'DeviceRepositoryPort', useExisting: DeviceRepository },
        { provide: 'AuditLogRepositoryPort', useExisting: AuditLogRepository },
    ],
    exports: [
        'MemberRepositoryPort',
        'PlanRepositoryPort',
        'SubscriptionRepositoryPort',
        'CachePort',
        'EventPublisherPort',
        'AuthServicePort',
        'EnrollmentMqttPort',
        'StatisticsRepositoryPort',
        'DeviceRepositoryPort',
        'AuditLogRepositoryPort',
        BullModule,
    ],
})
export class InfrastructureModule {}
