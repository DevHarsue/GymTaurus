import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class CreateRoutineExerciseDto {
    @IsOptional()
    @IsUUID()
    exerciseId?: string;

    @IsString()
    @MinLength(1)
    exerciseName!: string;

    @IsOptional()
    @IsIn(['weight_reps', 'reps', 'time', 'distance'])
    measurementType?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    orderIndex?: number;

    @IsInt()
    @Min(1)
    sets!: number;

    @IsString()
    @MinLength(1)
    reps!: string;

    @IsOptional()
    @IsString()
    weight?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    durationSeconds?: number;

    @IsOptional()
    @IsString()
    distance?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    restSeconds?: number;

    @IsOptional()
    @IsString()
    rpe?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateRoutineDayDto {
    @IsString()
    @MinLength(1)
    label!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    orderIndex?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateRoutineExerciseDto)
    exercises!: CreateRoutineExerciseDto[];
}

export class CreateRoutineDto {
    @IsString()
    @MinLength(2)
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsIn(['beginner', 'intermediate', 'advanced'])
    level!: string;

    @IsOptional()
    @IsString()
    goal?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateRoutineDayDto)
    days!: CreateRoutineDayDto[];
}
