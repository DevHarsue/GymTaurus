import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { MembersService } from './services/members.service';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { MembersProcessor } from '../infrastructure/jobs/members.processor';

@Module({
    imports: [InfrastructureModule],
    providers: [MembersService, PlansService, SubscriptionsService, MembersProcessor],
    exports: [MembersService, PlansService, SubscriptionsService],
})
export class ApplicationModule {}
