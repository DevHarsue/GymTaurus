import {
    IsIn,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export const MEASUREMENT_TYPES = [
    'weight_reps',
    'reps',
    'time',
    'distance',
] as const;

export class CreateExerciseDto {
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(60)
    muscleGroup?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    equipment?: string;

    @IsOptional()
    @IsIn(MEASUREMENT_TYPES)
    measurementType?: string;
}
