import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { MembersController } from './controllers/members.controller';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { DevicesController } from './controllers/devices.controller';
import { AuditLogController } from './controllers/audit-log.controller';
import { ExercisesController } from './controllers/exercises.controller';
import { RoutinesController } from './controllers/routines.controller';

@Module({
    imports: [ApplicationModule],
    controllers: [
        MembersController,
        PlansController,
        SubscriptionsController,
        StatisticsController,
        DevicesController,
        AuditLogController,
        ExercisesController,
        RoutinesController,
    ],
})
export class ApiModule {}
