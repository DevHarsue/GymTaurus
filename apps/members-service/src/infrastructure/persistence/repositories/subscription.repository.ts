import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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

    private toModel(entity: SubscriptionEntity): SubscriptionModel {
        return {
            id: entity.id,
            memberId: entity.memberId,
            planId: entity.planId,
            status: entity.status,
            startsAt: entity.startsAt,
            expiresAt: entity.expiresAt,
        };
    }

    async create(payload: CreateSubscriptionDto): Promise<SubscriptionModel> {
        const entity = this.repository.create({
            memberId: payload.memberId,
            planId: payload.planId,
            startsAt: new Date(payload.startsAt),
            expiresAt: new Date(payload.expiresAt),
            status: payload.status ?? 'expired',
        });
        const saved = await this.repository.save(entity);
        return this.toModel(saved);
    }

    async findById(id: string): Promise<SubscriptionModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async findByMemberId(memberId: string): Promise<SubscriptionModel[]> {
        const entities = await this.repository.find({
            where: { memberId },
            order: { createdAt: 'DESC' },
        });
        return entities.map(this.toModel);
    }

    async findActiveByMemberId(memberId: string): Promise<SubscriptionModel | null> {
        const entity = await this.repository.findOne({
            where: { memberId, status: 'active' },
            order: { expiresAt: 'DESC' },
        });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async updateStatus(id: string, status: string): Promise<void> {
        await this.repository.update(id, { status });
    }

    async update(id: string, payload: Partial<Omit<SubscriptionModel, 'id'>>): Promise<SubscriptionModel | null> {
        await this.repository.update(id, payload);
        return this.findById(id);
    }

    async findAll(): Promise<SubscriptionModel[]> {
        const entities = await this.repository.find({
            order: { createdAt: 'DESC' },
        });
        return entities.map(this.toModel);
    }

    async findExpired(referenceDate: Date): Promise<SubscriptionModel[]> {
        const entities = await this.repository.find({
            where: {
                status: 'active',
                expiresAt: LessThan(referenceDate),
            },
        });
        return entities.map(this.toModel);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
