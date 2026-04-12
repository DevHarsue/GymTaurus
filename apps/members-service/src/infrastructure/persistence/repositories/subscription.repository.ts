import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type CreateSubscriptionDto } from '../../../api/dtos/create-subscription.dto';
import {
    type SubscriptionModel,
    type SubscriptionRepositoryPort,
} from '../../../application/ports/subscription-repository.port';
import { SubscriptionEntity } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionRepository implements SubscriptionRepositoryPort {
    constructor(
        @InjectRepository(SubscriptionEntity)
        private readonly repository: Repository<SubscriptionEntity>,
    ) {}

    async create(payload: CreateSubscriptionDto): Promise<SubscriptionModel> {
        const entity = this.repository.create({
            memberId: payload.memberId,
            planId: payload.planId,
            startsAt: new Date(payload.startsAt),
            expiresAt: new Date(payload.expiresAt),
            status: payload.status ?? 'expired',
        });
        const saved = await this.repository.save(entity);
        return {
            id: saved.id,
            memberId: saved.memberId,
            planId: saved.planId,
            status: saved.status,
            startsAt: saved.startsAt,
            expiresAt: saved.expiresAt,
        };
    }
}
