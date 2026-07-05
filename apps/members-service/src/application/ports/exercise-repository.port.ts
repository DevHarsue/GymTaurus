export interface ExerciseModel {
    id: string;
    name: string;
    description?: string | null;
    muscleGroup?: string | null;
    equipment?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateExerciseData {
    name: string;
    description?: string;
    muscleGroup?: string;
    equipment?: string;
    createdBy?: string;
}

export interface ExerciseRepositoryPort {
    create(payload: CreateExerciseData): Promise<ExerciseModel>;
    findAll(includeInactive?: boolean): Promise<ExerciseModel[]>;
    findById(id: string): Promise<ExerciseModel | null>;
    update(
        id: string,
        payload: Partial<Omit<ExerciseModel, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<ExerciseModel | null>;
    delete(id: string): Promise<boolean>;
}
