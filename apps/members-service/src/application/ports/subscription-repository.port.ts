import { CreateSubscriptionDto } from '../../api/dtos/create-subscription.dto';

export interface SubscriptionModel {
    id: string;
    memberId: string;
    planId: string;
    status: string;
    startsAt: Date;
    expiresAt: Date;
}

export interface SubscriptionRepositoryPort {
    create(payload: CreateSubscriptionDto): Promise<SubscriptionModel>;
    findById(id: string): Promise<SubscriptionModel | null>;
    findByMemberId(memberId: string): Promise<SubscriptionModel[]>;
    findActiveByMemberId(memberId: string): Promise<SubscriptionModel | null>;
    updateStatus(id: string, status: string): Promise<void>;
    update(id: string, payload: Partial<Omit<SubscriptionModel, 'id'>>): Promise<SubscriptionModel | null>;
    findAll(): Promise<SubscriptionModel[]>;
    findExpired(referenceDate: Date): Promise<SubscriptionModel[]>;
    delete(id: string): Promise<boolean>;
}
