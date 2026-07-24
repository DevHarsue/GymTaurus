import { Type } from 'class-transformer';
import {
    IsArray,
    IsIn,
    IsUUID,
    ValidateNested,
} from 'class-validator';

const WEEKDAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export class ScheduleEntryDto {
    @IsIn(WEEKDAYS)
    weekday!: string;

    @IsUUID()
    routineId!: string;

    @IsUUID()
    routineDayId!: string;
}

export class SetMemberScheduleDto {
    /** Lista de días con rutina. Los días ausentes se consideran descanso. */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleEntryDto)
    entries!: ScheduleEntryDto[];
}
