import { IsUUID } from 'class-validator';

export class RenewSubscriptionDto {
    @IsUUID()
    planId!: string;
}
