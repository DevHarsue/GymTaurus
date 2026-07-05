import { type DayMapping } from '../../infrastructure/persistence/entities/routine-assignment.entity';

export interface RoutineAssignmentModel {
    id: string;
    memberId: string;
    routineId: string;
    assignedBy?: string | null;
    dayMapping: DayMapping;
    startsAt: Date;
    endsAt?: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAssignmentData {
    memberId: string;
    routineId: string;
    assignedBy?: string;
    dayMapping: DayMapping;
    startsAt: Date;
    endsAt?: Date | null;
}

export interface RoutineAssignmentRepositoryPort {
    /** Crea una asignacion activa, marcando como 'finished' la activa previa. */
    assign(payload: CreateAssignmentData): Promise<RoutineAssignmentModel>;
    findActiveByMemberId(memberId: string): Promise<RoutineAssignmentModel | null>;
    findByMemberId(memberId: string): Promise<RoutineAssignmentModel[]>;
    findById(id: string): Promise<RoutineAssignmentModel | null>;
    deactivate(id: string): Promise<boolean>;
}

export type { DayMapping };
