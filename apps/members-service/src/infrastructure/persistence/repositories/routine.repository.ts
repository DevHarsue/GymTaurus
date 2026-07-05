import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type CreateRoutineData,
    type RoutineDetail,
    type RoutineModel,
    type RoutineRepositoryPort,
    type UpdateRoutineData,
} from '../../../application/ports/routine-repository.port';
import { RoutineEntity } from '../entities/routine.entity';
import { RoutineDayEntity } from '../entities/routine-day.entity';
import { RoutineExerciseEntity } from '../entities/routine-exercise.entity';

@Injectable()
export class RoutineRepository implements RoutineRepositoryPort {
    constructor(
        @InjectRepository(RoutineEntity)
        private readonly repository: Repository<RoutineEntity>,
    ) {}

    private toModel(entity: RoutineEntity): RoutineModel {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description ?? null,
            level: entity.level,
            goal: entity.goal ?? null,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    private toDetail(entity: RoutineEntity): RoutineDetail {
        const days = (entity.days ?? [])
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((day) => ({
                id: day.id,
                routineId: day.routineId,
                label: day.label,
                orderIndex: day.orderIndex,
                exercises: (day.exercises ?? [])
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((ex) => ({
                        id: ex.id,
                        routineDayId: ex.routineDayId,
                        exerciseId: ex.exerciseId ?? null,
                        exerciseName: ex.exerciseName,
                        orderIndex: ex.orderIndex,
                        sets: ex.sets,
                        reps: ex.reps,
                        weight: ex.weight ?? null,
                        restSeconds: ex.restSeconds ?? null,
                        rpe: ex.rpe ?? null,
                        notes: ex.notes ?? null,
                    })),
            }));
        return { ...this.toModel(entity), days };
    }

    private buildDays(days: CreateRoutineData['days']): RoutineDayEntity[] {
        return days.map((day, dayIdx) => {
            const dayEntity = new RoutineDayEntity();
            dayEntity.label = day.label;
            dayEntity.orderIndex = day.orderIndex ?? dayIdx;
            dayEntity.exercises = day.exercises.map((ex, exIdx) => {
                const exEntity = new RoutineExerciseEntity();
                exEntity.exerciseId = ex.exerciseId ?? null;
                exEntity.exerciseName = ex.exerciseName;
                exEntity.orderIndex = ex.orderIndex ?? exIdx;
                exEntity.sets = ex.sets;
                exEntity.reps = ex.reps;
                exEntity.weight = ex.weight ?? null;
                exEntity.restSeconds = ex.restSeconds ?? null;
                exEntity.rpe = ex.rpe ?? null;
                exEntity.notes = ex.notes ?? null;
                return exEntity;
            });
            return dayEntity;
        });
    }

    async create(payload: CreateRoutineData): Promise<RoutineDetail> {
        const entity = this.repository.create({
            name: payload.name,
            description: payload.description ?? null,
            level: payload.level,
            goal: payload.goal ?? null,
            createdBy: payload.createdBy ?? null,
            days: this.buildDays(payload.days),
        });
        const saved = await this.repository.save(entity);
        const detail = await this.findById(saved.id);
        return detail as RoutineDetail;
    }

    async findAll(includeInactive = false): Promise<RoutineModel[]> {
        const entities = await this.repository.find({
            where: includeInactive ? {} : { isActive: true },
            order: { createdAt: 'DESC' },
        });
        return entities.map((e) => this.toModel(e));
    }

    async findById(id: string): Promise<RoutineDetail | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['days', 'days.exercises'],
        });
        return entity ? this.toDetail(entity) : null;
    }

    async update(
        id: string,
        payload: UpdateRoutineData,
    ): Promise<RoutineDetail | null> {
        return this.repository.manager.transaction(async (manager) => {
            const existing = await manager.findOne(RoutineEntity, {
                where: { id },
            });
            if (!existing) return null;

            const headerPatch: Partial<RoutineEntity> = {};
            if (payload.name !== undefined) headerPatch.name = payload.name;
            if (payload.description !== undefined)
                headerPatch.description = payload.description;
            if (payload.level !== undefined) headerPatch.level = payload.level;
            if (payload.goal !== undefined) headerPatch.goal = payload.goal;
            if (payload.isActive !== undefined)
                headerPatch.isActive = payload.isActive;
            if (Object.keys(headerPatch).length > 0) {
                await manager.update(RoutineEntity, id, headerPatch);
            }

            // Reemplazo total del arbol de dias/ejercicios si se provee.
            if (payload.days) {
                await manager.delete(RoutineDayEntity, { routineId: id });
                const days = this.buildDays(payload.days).map((day) => {
                    day.routineId = id;
                    return day;
                });
                await manager.save(RoutineDayEntity, days);
            }

            const refreshed = await manager.findOne(RoutineEntity, {
                where: { id },
                relations: ['days', 'days.exercises'],
            });
            return refreshed ? this.toDetail(refreshed) : null;
        });
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.update(id, { isActive: false });
        return (result.affected ?? 0) > 0;
    }
}
