import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateSubscriptionDto } from '../../api/dtos/create-subscription.dto';
import { RenewSubscriptionDto } from '../../api/dtos/renew-subscription.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type SubscriptionModel,
    type SubscriptionRepositoryPort,
} from '../ports/subscription-repository.port';
import { type PlanRepositoryPort } from '../ports/plan-repository.port';

@Injectable()
export class SubscriptionsService {
    constructor(
        @Inject('SubscriptionRepositoryPort')
        private readonly subscriptionRepository: SubscriptionRepositoryPort,
        @Inject('PlanRepositoryPort')
        private readonly planRepository: PlanRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
        @InjectQueue('members-jobs')
        private readonly jobsQueue: Queue,
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

    async getSubscription(id: string): Promise<SubscriptionModel | null> {
        return this.subscriptionRepository.findById(id);
    }

    async listSubscriptions(): Promise<SubscriptionModel[]> {
        return this.subscriptionRepository.findAll();
    }

    async getActiveSubscription(memberId: string): Promise<SubscriptionModel | null> {
        return this.subscriptionRepository.findActiveByMemberId(memberId);
    }

    async renewSubscription(
        memberId: string,
        payload: RenewSubscriptionDto,
        renewedByUserId: string,
    ): Promise<SubscriptionModel> {
        const plan = await this.planRepository.findById(payload.planId);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${payload.planId} not found`);
        }
        if (!plan.isActive) {
            throw new BadRequestException('Selected plan is not active');
        }

        let startsAt = new Date();
        const activeSub = await this.getActiveSubscription(memberId);
        
        if (activeSub) {
            startsAt = activeSub.expiresAt < startsAt ? new Date() : new Date(activeSub.expiresAt);
            if (activeSub.id) {
                await this.subscriptionRepository.updateStatus(activeSub.id, 'expired');
            }
        }

        const expiresAt = new Date(startsAt);
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

        const newSub = await this.subscriptionRepository.create({
            memberId,
            planId: plan.id,
            startsAt: startsAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            status: 'active',
        });

        const msUntilExpiration = expiresAt.getTime() - Date.now();
        await this.jobsQueue.add(
            'renewals',
            { subscriptionId: newSub.id, memberId },
            { delay: msUntilExpiration > 0 ? msUntilExpiration : 0 },
        );

        const msUntil5Days = expiresAt.getTime() - (5 * 24 * 60 * 60 * 1000) - Date.now();
        if (msUntil5Days > 0) {
            await this.jobsQueue.add('membership-reminders', { type: '5d', subscriptionId: newSub.id, memberId }, { delay: msUntil5Days });
        }

        const msUntil1Day = expiresAt.getTime() - (1 * 24 * 60 * 60 * 1000) - Date.now();
        if (msUntil1Day > 0) {
            await this.jobsQueue.add('membership-reminders', { type: '1d', subscriptionId: newSub.id, memberId }, { delay: msUntil1Day });
        }

        await this.eventPublisher.publish('membership:renewed', {
            memberId,
            expiresAt: newSub.expiresAt,
        });

        return newSub;
    }

    async updateSubscription(id: string, payload: Partial<SubscriptionModel>): Promise<SubscriptionModel> {
        const sub = await this.subscriptionRepository.update(id, payload);
        if (!sub) {
            throw new NotFoundException(`Subscription with ID ${id} not found`);
        }
        return sub;
    }

    async deleteSubscription(id: string): Promise<void> {
        const deleted = await this.subscriptionRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Subscription with ID ${id} not found`);
        }
        await this.eventPublisher.publish('members.subscription.deleted', { id });
    }

    async processExpirations(): Promise<void> {
        const expired = await this.subscriptionRepository.findExpired(new Date());
        for (const sub of expired) {
            await this.subscriptionRepository.updateStatus(sub.id, 'expired');
            await this.eventPublisher.publish('membership:expired', {
                memberId: sub.memberId,
                expiredAt: sub.expiresAt,
            });
        }
    }
}
