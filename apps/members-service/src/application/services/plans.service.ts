import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePlanDto } from '../../api/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../api/dtos/update-plan.dto';
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

    async getPlan(id: string): Promise<PlanModel | null> {
        const cached = await this.cache.get(`plan:${id}`);
        if (cached) {
            return JSON.parse(cached) as PlanModel;
        }

        const plan = await this.planRepository.findById(id);
        if (plan) {
            await this.cache.set(`plan:${id}`, JSON.stringify(plan), 300);
        }
        return plan;
    }

    async listPlans(): Promise<PlanModel[]> {
        return this.planRepository.findAll();
    }

    async updatePlan(id: string, payload: UpdatePlanDto): Promise<PlanModel> {
        const plan = await this.planRepository.update(id, payload);
        if (!plan) {
            throw new NotFoundException(`Plan with ID ${id} not found`);
        }
        await this.cache.set(`plan:${id}`, JSON.stringify(plan), 300);
        return plan;
    }

    async deletePlan(id: string): Promise<void> {
        const deleted = await this.planRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Plan with ID ${id} not found`);
        }
        await this.cache.delete(`plan:${id}`);
        await this.eventPublisher.publish('members.plan.deleted', { id });
    }
}
