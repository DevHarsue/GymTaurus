export interface SetLogModel {
    id: string;
    routineExerciseId?: string | null;
    exerciseName: string;
    setNumber: number;
    repsDone?: number | null;
    weightDone?: number | null;
    durationDone?: number | null;
    distanceDone?: number | null;
    done: boolean;
}

export interface WorkoutLogModel {
    id: string;
    memberId: string;
    assignmentId?: string | null;
    routineDayId?: string | null;
    dayLabel?: string | null;
    performedOn: string;
    status: string;
    notes?: string | null;
    createdAt: Date;
    sets: SetLogModel[];
}

export interface CreateSetLogData {
    routineExerciseId?: string;
    exerciseName: string;
    setNumber: number;
    repsDone?: number;
    weightDone?: number;
    durationDone?: number;
    distanceDone?: number;
    done?: boolean;
}

export interface CreateWorkoutLogData {
    memberId: string;
    assignmentId?: string;
    routineDayId?: string;
    dayLabel?: string;
    performedOn: string;
    status?: string;
    notes?: string;
    clientId?: string;
    sets: CreateSetLogData[];
}

export interface WorkoutLogRepositoryPort {
    create(payload: CreateWorkoutLogData): Promise<WorkoutLogModel>;
    findByMemberId(memberId: string, limit?: number): Promise<WorkoutLogModel[]>;
}
