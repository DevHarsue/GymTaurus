import { Body, Controller, Post } from '@nestjs/common';
import { SubscriptionsService } from '../../application/services/subscriptions.service';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Post()
    create(@Body() payload: CreateSubscriptionDto) {
        return this.subscriptionsService.createSubscription(payload);
    }
}
