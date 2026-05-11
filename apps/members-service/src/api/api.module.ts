import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { MembersController } from './controllers/members.controller';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { StatisticsController } from './controllers/statistics.controller';

@Module({
    imports: [ApplicationModule],
    controllers: [MembersController, PlansController, SubscriptionsController, StatisticsController],
})
export class ApiModule {}
