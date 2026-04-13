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
    findAll(): Promise<PlanModel[]>;
    findById(id: string): Promise<PlanModel | null>;
    update(id: string, payload: Partial<Omit<PlanModel, 'id'>>): Promise<PlanModel | null>;
    delete(id: string): Promise<boolean>;
}
