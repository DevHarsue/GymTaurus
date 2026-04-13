import { Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job } from 'bull';
import { EventPublisherPort } from '../../application/ports/event-publisher.port';
import { SubscriptionsService } from '../../application/services/subscriptions.service';

@Injectable()
@Processor('members-jobs')
export class MembersProcessor {
    private readonly logger = new Logger(MembersProcessor.name);

    constructor(
        private readonly subscriptionsService: SubscriptionsService,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    @Process('renewals')
    async handleRenewals(job: Job<{ subscriptionId: string; memberId: string }>): Promise<void> {
        this.logger.log(`Processing expiration for subscription ${job.data.subscriptionId}`);
        // Procesamos todas las expiraciones para asegurarnos
        await this.subscriptionsService.processExpirations();
    }

    @Process('membership-reminders')
    async handleReminders(job: Job<{ type: string; subscriptionId: string; memberId: string }>): Promise<void> {
        this.logger.log(`Processing reminder ${job.data.type} for member ${job.data.memberId}`);
        
        const activeSub = await this.subscriptionsService.getActiveSubscription(job.data.memberId);
        if (!activeSub || activeSub.id !== job.data.subscriptionId) {
            return; // Ya fue renovada o es otra subscripción
        }

        const msUntilExp = new Date(activeSub.expiresAt).getTime() - Date.now();
        const daysLeft = Math.ceil(msUntilExp / (1000 * 60 * 60 * 24));

        await this.eventPublisher.publish('membership:expiring-soon', {
            memberId: job.data.memberId,
            daysLeft,
            expiresAt: activeSub.expiresAt,
        });
    }

    // Cron de reconciliacion: safety net diario 4 AM
    @Cron('0 4 * * *')
    async handleDailyReconciliation() {
        this.logger.log('Running daily 4 AM reconciliation cron for expired subscriptions');
        await this.subscriptionsService.processExpirations();
    }
}
