import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type CreatePlanDto } from '../../../api/dtos/create-plan.dto';
import {
    type PlanModel,
    type PlanRepositoryPort,
} from '../../../application/ports/plan-repository.port';
import { MembershipPlanEntity } from '../entities/membership-plan.entity';

@Injectable()
export class PlanRepository implements PlanRepositoryPort {
    constructor(
        @InjectRepository(MembershipPlanEntity)
        private readonly repository: Repository<MembershipPlanEntity>,
    ) {}

    async create(payload: CreatePlanDto): Promise<PlanModel> {
        const entity = this.repository.create({
            ...payload,
            referencePrice: payload.referencePrice ?? 0,
            isActive: payload.isActive ?? true,
        });
        const saved = await this.repository.save(entity);
        return {
            id: saved.id,
            name: saved.name,
            durationDays: saved.durationDays,
            referencePrice: Number(saved.referencePrice),
            isActive: saved.isActive,
        };
    }
}
