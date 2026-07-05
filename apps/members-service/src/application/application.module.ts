import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { MembersService } from './services/members.service';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { EnrollmentService } from './services/enrollment.service';
import { StatisticsService } from './services/statistics.service';
import { DevicesService } from './services/devices.service';
import { AuditLogService } from './services/audit-log.service';
import { ExercisesService } from './services/exercises.service';
import { RoutinesService } from './services/routines.service';
import { WorkoutLogsService } from './services/workout-logs.service';
import { MembersProcessor } from '../infrastructure/jobs/members.processor';

@Module({
    imports: [InfrastructureModule],
    providers: [
        MembersService,
        PlansService,
        SubscriptionsService,
        EnrollmentService,
        StatisticsService,
        DevicesService,
        AuditLogService,
        ExercisesService,
        RoutinesService,
        WorkoutLogsService,
        MembersProcessor,
    ],
    exports: [
        MembersService,
        PlansService,
        SubscriptionsService,
        EnrollmentService,
        StatisticsService,
        DevicesService,
        AuditLogService,
        ExercisesService,
        RoutinesService,
        WorkoutLogsService,
        InfrastructureModule,
    ],
})
export class ApplicationModule {}
