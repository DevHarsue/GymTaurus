import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type CreateExerciseData,
    type ExerciseModel,
    type ExerciseRepositoryPort,
} from '../../../application/ports/exercise-repository.port';
import { ExerciseEntity } from '../entities/exercise.entity';

@Injectable()
export class ExerciseRepository implements ExerciseRepositoryPort {
    constructor(
        @InjectRepository(ExerciseEntity)
        private readonly repository: Repository<ExerciseEntity>,
    ) {}

    private toModel(entity: ExerciseEntity): ExerciseModel {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description ?? null,
            muscleGroup: entity.muscleGroup ?? null,
            equipment: entity.equipment ?? null,
            measurementType: entity.measurementType,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    async create(payload: CreateExerciseData): Promise<ExerciseModel> {
        const entity = this.repository.create({
            name: payload.name,
            description: payload.description ?? null,
            muscleGroup: payload.muscleGroup ?? null,
            equipment: payload.equipment ?? null,
            measurementType: payload.measurementType ?? 'weight_reps',
            createdBy: payload.createdBy ?? null,
        });
        const saved = await this.repository.save(entity);
        return this.toModel(saved);
    }

    async findAll(includeInactive = false): Promise<ExerciseModel[]> {
        const entities = await this.repository.find({
            where: includeInactive ? {} : { isActive: true },
            order: { name: 'ASC' },
        });
        return entities.map((e) => this.toModel(e));
    }

    async findById(id: string): Promise<ExerciseModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toModel(entity) : null;
    }

    async update(
        id: string,
        payload: Partial<Omit<ExerciseModel, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<ExerciseModel | null> {
        await this.repository.update(id, payload);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.update(id, { isActive: false });
        return (result.affected ?? 0) > 0;
    }
}
