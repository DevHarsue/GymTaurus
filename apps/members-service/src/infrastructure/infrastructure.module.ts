import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisEventPublisher } from './messaging/redis-event-publisher';
import { RedisCacheService } from './cache/redis-cache.service';
import { DeviceEntity } from './persistence/entities/device.entity';
import { MemberEntity } from './persistence/entities/member.entity';
import { MembershipPlanEntity } from './persistence/entities/membership-plan.entity';
import { RenewalEntity } from './persistence/entities/renewal.entity';
import { SubscriptionEntity } from './persistence/entities/subscription.entity';
import { MemberRepository } from './persistence/repositories/member.repository';
import { PlanRepository } from './persistence/repositories/plan.repository';
import { SubscriptionRepository } from './persistence/repositories/subscription.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MemberEntity,
            MembershipPlanEntity,
            SubscriptionEntity,
            RenewalEntity,
            DeviceEntity,
        ]),
        BullModule.registerQueue({ name: 'members-jobs' }),
    ],
    providers: [
        MemberRepository,
        PlanRepository,
        SubscriptionRepository,
        RedisCacheService,
        RedisEventPublisher,

        { provide: 'MemberRepositoryPort', useExisting: MemberRepository },
        { provide: 'PlanRepositoryPort', useExisting: PlanRepository },
        {
            provide: 'SubscriptionRepositoryPort',
            useExisting: SubscriptionRepository,
        },
        { provide: 'CachePort', useExisting: RedisCacheService },
        { provide: 'EventPublisherPort', useExisting: RedisEventPublisher },
    ],
    exports: [
        'MemberRepositoryPort',
        'PlanRepositoryPort',
        'SubscriptionRepositoryPort',
        'CachePort',
        'EventPublisherPort',
        BullModule,
    ],
})
export class InfrastructureModule {}
