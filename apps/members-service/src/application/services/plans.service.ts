import { Inject, Injectable } from '@nestjs/common';
import { CreatePlanDto } from '../../api/dtos/create-plan.dto';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type PlanModel,
    type PlanRepositoryPort,
} from '../ports/plan-repository.port';

@Injectable()
export class PlansService {
    constructor(
        @Inject('PlanRepositoryPort')
        private readonly planRepository: PlanRepositoryPort,
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async createPlan(payload: CreatePlanDto): Promise<PlanModel> {
        const plan = await this.planRepository.create(payload);
        await this.cache.set(`plan:${plan.id}`, JSON.stringify(plan), 300);
        await this.eventPublisher.publish('members.plan.created', plan);
        return plan;
    }
}
