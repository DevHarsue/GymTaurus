import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class BaseDto {
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsOptional()
    @IsISO8601()
    createdAt?: string;

    @IsOptional()
    @IsISO8601()
    updatedAt?: string;
}
