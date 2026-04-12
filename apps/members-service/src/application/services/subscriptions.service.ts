import { Inject, Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from '../../api/dtos/create-subscription.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type SubscriptionModel,
    type SubscriptionRepositoryPort,
} from '../ports/subscription-repository.port';

@Injectable()
export class SubscriptionsService {
    constructor(
        @Inject('SubscriptionRepositoryPort')
        private readonly subscriptionRepository: SubscriptionRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async createSubscription(
        payload: CreateSubscriptionDto,
    ): Promise<SubscriptionModel> {
        const subscription = await this.subscriptionRepository.create(payload);
        await this.eventPublisher.publish(
            'members.subscription.created',
            subscription,
        );
        return subscription;
    }
}
