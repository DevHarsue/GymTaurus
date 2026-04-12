import { CreatePlanDto } from '../../api/dtos/create-plan.dto';

export interface PlanModel {
    id: string;
    name: string;
    durationDays: number;
    referencePrice: number;
    isActive: boolean;
}

export interface PlanRepositoryPort {
    create(payload: CreatePlanDto): Promise<PlanModel>;
}
