import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisEventPublisher } from './messaging/redis-event-publisher';
import { EnrollmentMqttGateway } from './messaging/enrollment-mqtt.gateway';
import { RedisCacheService } from './cache/redis-cache.service';
import { AuthHttpService } from './integrations/auth-http.service';
import { AuditLogEntity } from './persistence/entities/audit-log.entity';
import { DeviceEntity } from './persistence/entities/device.entity';
import { IdempotencyKeyEntity } from './persistence/entities/idempotency-key.entity';
import { MemberEntity } from './persistence/entities/member.entity';
import { MembershipPlanEntity } from './persistence/entities/membership-plan.entity';
import { RenewalEntity } from './persistence/entities/renewal.entity';
import { SubscriptionEntity } from './persistence/entities/subscription.entity';
import { ExerciseEntity } from './persistence/entities/exercise.entity';
import { RoutineEntity } from './persistence/entities/routine.entity';
import { RoutineDayEntity } from './persistence/entities/routine-day.entity';
import { RoutineExerciseEntity } from './persistence/entities/routine-exercise.entity';
import { RoutineAssignmentEntity } from './persistence/entities/routine-assignment.entity';
import { WorkoutLogEntity } from './persistence/entities/workout-log.entity';
import { SetLogEntity } from './persistence/entities/set-log.entity';
import { MemberScheduleEntity } from './persistence/entities/member-schedule.entity';
import { AuditLogRepository } from './persistence/repositories/audit-log.repository';
import { IdempotencyRepository } from './persistence/repositories/idempotency.repository';
import { MemberRepository } from './persistence/repositories/member.repository';
import { PlanRepository } from './persistence/repositories/plan.repository';
import { SubscriptionRepository } from './persistence/repositories/subscription.repository';
import { StatisticsRepository } from './persistence/repositories/statistics.repository';
import { DeviceRepository } from './persistence/repositories/device.repository';
import { ExerciseRepository } from './persistence/repositories/exercise.repository';
import { RoutineRepository } from './persistence/repositories/routine.repository';
import { RoutineAssignmentRepository } from './persistence/repositories/routine-assignment.repository';
import { WorkoutLogRepository } from './persistence/repositories/workout-log.repository';
import { MemberScheduleRepository } from './persistence/repositories/member-schedule.repository';
import { IdempotencyCleanupService } from './jobs/idempotency-cleanup.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MemberEntity,
            MembershipPlanEntity,
            SubscriptionEntity,
            RenewalEntity,
            DeviceEntity,
            AuditLogEntity,
            IdempotencyKeyEntity,
            ExerciseEntity,
            RoutineEntity,
            RoutineDayEntity,
            RoutineExerciseEntity,
            RoutineAssignmentEntity,
            WorkoutLogEntity,
            SetLogEntity,
            MemberScheduleEntity,
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
        IdempotencyRepository,
        ExerciseRepository,
        RoutineRepository,
        RoutineAssignmentRepository,
        WorkoutLogRepository,
        MemberScheduleRepository,
        IdempotencyCleanupService,
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
        {
            provide: 'IdempotencyRepositoryPort',
            useExisting: IdempotencyRepository,
        },
        { provide: 'ExerciseRepositoryPort', useExisting: ExerciseRepository },
        { provide: 'RoutineRepositoryPort', useExisting: RoutineRepository },
        {
            provide: 'RoutineAssignmentRepositoryPort',
            useExisting: RoutineAssignmentRepository,
        },
        {
            provide: 'WorkoutLogRepositoryPort',
            useExisting: WorkoutLogRepository,
        },
        {
            provide: 'MemberScheduleRepositoryPort',
            useExisting: MemberScheduleRepository,
        },
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
        'IdempotencyRepositoryPort',
        'ExerciseRepositoryPort',
        'RoutineRepositoryPort',
        'RoutineAssignmentRepositoryPort',
        'WorkoutLogRepositoryPort',
        'MemberScheduleRepositoryPort',
        BullModule,
    ],
})
export class InfrastructureModule {}
