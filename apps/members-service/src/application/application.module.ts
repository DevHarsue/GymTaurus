import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { MembersService } from './services/members.service';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';

@Module({
    imports: [InfrastructureModule],
    providers: [MembersService, PlansService, SubscriptionsService],
    exports: [MembersService, PlansService, SubscriptionsService],
})
export class ApplicationModule {}
