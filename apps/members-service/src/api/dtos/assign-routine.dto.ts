import { IsDateString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { type DayMapping } from '../../infrastructure/persistence/entities/routine-assignment.entity';

const WEEK_DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export class AssignRoutineDto {
    @IsUUID()
    routineId!: string;

    @IsUUID()
    memberId!: string;

    /**
     * Mapeo dia de semana -> id del routine_day, p.ej.
     * { "monday": "<dayId>", "wednesday": "<dayId>" }.
     * Las claves ausentes se consideran dias de descanso.
     */
    @IsObject()
    dayMapping!: DayMapping;

    @IsOptional()
    @IsDateString()
    startsAt?: string;

    @IsOptional()
    @IsDateString()
    endsAt?: string;
}

export { WEEK_DAYS };
