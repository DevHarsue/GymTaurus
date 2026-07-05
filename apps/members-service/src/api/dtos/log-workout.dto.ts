import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class LogSetDto {
    @IsOptional()
    @IsUUID()
    routineExerciseId?: string;

    @IsString()
    @MinLength(1)
    exerciseName!: string;

    @IsInt()
    @Min(1)
    setNumber!: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    repsDone?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weightDone?: number;

    @IsOptional()
    @IsBoolean()
    done?: boolean;
}

export class LogWorkoutDto {
    @IsOptional()
    @IsUUID()
    assignmentId?: string;

    @IsOptional()
    @IsUUID()
    routineDayId?: string;

    @IsOptional()
    @IsString()
    dayLabel?: string;

    /** Fecha YYYY-MM-DD. Si se omite, se usa la fecha del servidor. */
    @IsOptional()
    @IsString()
    performedOn?: string;

    @IsOptional()
    @IsIn(['completed', 'partial', 'skipped'])
    status?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    /** Id de cliente para deduplicacion offline (ademas de Idempotency-Key). */
    @IsOptional()
    @IsUUID()
    clientId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LogSetDto)
    sets!: LogSetDto[];
}
