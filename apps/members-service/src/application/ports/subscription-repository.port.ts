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
}
