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

    private toModel(entity: MembershipPlanEntity): PlanModel {
        return {
            id: entity.id,
            name: entity.name,
            durationDays: entity.durationDays,
            referencePrice: Number(entity.referencePrice),
            isActive: entity.isActive,
        };
    }

    async create(payload: CreatePlanDto): Promise<PlanModel> {
        const entity = this.repository.create({
            ...payload,
            referencePrice: payload.referencePrice ?? 0,
            isActive: payload.isActive ?? true,
        });
        const saved = await this.repository.save(entity);
        return this.toModel(saved);
    }

    async findAll(): Promise<PlanModel[]> {
        const entities = await this.repository.find({ order: { referencePrice: 'ASC' } });
        return entities.map(this.toModel);
    }

    async findById(id: string): Promise<PlanModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async update(id: string, payload: Partial<Omit<PlanModel, 'id'>>): Promise<PlanModel | null> {
        await this.repository.update(id, payload);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.update(id, { isActive: false });
        return (result.affected ?? 0) > 0;
    }
}
