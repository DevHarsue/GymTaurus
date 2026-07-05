export interface RoutineExerciseModel {
    id: string;
    routineDayId: string;
    exerciseId?: string | null;
    exerciseName: string;
    orderIndex: number;
    sets: number;
    reps: string;
    weight?: string | null;
    restSeconds?: number | null;
    rpe?: string | null;
    notes?: string | null;
}

export interface RoutineDayModel {
    id: string;
    routineId: string;
    label: string;
    orderIndex: number;
    exercises: RoutineExerciseModel[];
}

export interface RoutineModel {
    id: string;
    name: string;
    description?: string | null;
    level: string;
    goal?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/** Rutina con su arbol completo (dias + ejercicios). */
export interface RoutineDetail extends RoutineModel {
    days: RoutineDayModel[];
}

export interface CreateRoutineExerciseData {
    exerciseId?: string;
    exerciseName: string;
    orderIndex?: number;
    sets: number;
    reps: string;
    weight?: string;
    restSeconds?: number;
    rpe?: string;
    notes?: string;
}

export interface CreateRoutineDayData {
    label: string;
    orderIndex?: number;
    exercises: CreateRoutineExerciseData[];
}

export interface CreateRoutineData {
    name: string;
    description?: string;
    level: string;
    goal?: string;
    createdBy?: string;
    days: CreateRoutineDayData[];
}

export interface UpdateRoutineData {
    name?: string;
    description?: string;
    level?: string;
    goal?: string;
    isActive?: boolean;
    /** Si se provee, reemplaza por completo el arbol de dias/ejercicios. */
    days?: CreateRoutineDayData[];
}

export interface RoutineRepositoryPort {
    create(payload: CreateRoutineData): Promise<RoutineDetail>;
    findAll(includeInactive?: boolean): Promise<RoutineModel[]>;
    findById(id: string): Promise<RoutineDetail | null>;
    update(id: string, payload: UpdateRoutineData): Promise<RoutineDetail | null>;
    delete(id: string): Promise<boolean>;
}
