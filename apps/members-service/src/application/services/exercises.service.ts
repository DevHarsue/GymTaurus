import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExerciseDto } from '../../api/dtos/create-exercise.dto';
import { UpdateExerciseDto } from '../../api/dtos/update-exercise.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type ExerciseModel,
    type ExerciseRepositoryPort,
} from '../ports/exercise-repository.port';

@Injectable()
export class ExercisesService {
    constructor(
        @Inject('ExerciseRepositoryPort')
        private readonly exerciseRepository: ExerciseRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async createExercise(
        payload: CreateExerciseDto,
        createdBy: string,
    ): Promise<ExerciseModel> {
        const exercise = await this.exerciseRepository.create({
            ...payload,
            createdBy,
        });
        await this.eventPublisher.publish('members.exercise.created', exercise);
        return exercise;
    }

    async listExercises(includeInactive = false): Promise<ExerciseModel[]> {
        return this.exerciseRepository.findAll(includeInactive);
    }

    async getExercise(id: string): Promise<ExerciseModel> {
        const exercise = await this.exerciseRepository.findById(id);
        if (!exercise) {
            throw new NotFoundException(`Ejercicio ${id} no encontrado`);
        }
        return exercise;
    }

    async updateExercise(
        id: string,
        payload: UpdateExerciseDto,
    ): Promise<ExerciseModel> {
        const exercise = await this.exerciseRepository.update(id, payload);
        if (!exercise) {
            throw new NotFoundException(`Ejercicio ${id} no encontrado`);
        }
        return exercise;
    }

    async deleteExercise(id: string): Promise<void> {
        const deleted = await this.exerciseRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Ejercicio ${id} no encontrado`);
        }
        await this.eventPublisher.publish('members.exercise.deleted', { id });
    }
}
