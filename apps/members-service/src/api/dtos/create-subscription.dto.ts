import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
    @IsUUID()
    memberId!: string;

    @IsUUID()
    planId!: string;

    @IsDateString()
    startsAt!: string;

    @IsDateString()
    expiresAt!: string;

    @IsOptional()
    @IsString()
    status?: string;
}
