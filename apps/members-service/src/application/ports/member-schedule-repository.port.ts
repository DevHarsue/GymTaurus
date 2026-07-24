import { type RoutineExerciseModel } from './routine-repository.port';

/** Un día del horario semanal del miembro, resuelto con su rutina/día/ejercicios. */
export interface ScheduledDay {
    weekday: string;
    routineId: string;
    routineName: string;
    routineDayId: string;
    dayLabel: string;
    exercises: RoutineExerciseModel[];
}

export interface ScheduleEntryData {
    weekday: string;
    routineId: string;
    routineDayId: string;
}

export interface MemberScheduleRepositoryPort {
    /** Horario resuelto (con rutina + día + ejercicios) de un miembro. */
    findByMemberId(memberId: string): Promise<ScheduledDay[]>;
    /** Reemplaza por completo el horario del miembro. */
    replaceForMember(
        memberId: string,
        entries: ScheduleEntryData[],
        assignedBy?: string,
    ): Promise<ScheduledDay[]>;
    /** Elimina todas las entradas de horario que referencian una rutina. */
    deleteByRoutineId(routineId: string): Promise<void>;
}
