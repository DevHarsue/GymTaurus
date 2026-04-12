import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MinLength,
} from 'class-validator';

export class CreatePlanDto {
    @IsString()
    @MinLength(2)
    name!: string;

    @IsNumber()
    @IsPositive()
    durationDays!: number;

    @IsOptional()
    @IsNumber()
    referencePrice?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
