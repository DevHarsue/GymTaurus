import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type CreateWorkoutLogData,
    type WorkoutLogModel,
    type WorkoutLogRepositoryPort,
} from '../../../application/ports/workout-log-repository.port';
import { WorkoutLogEntity } from '../entities/workout-log.entity';
import { SetLogEntity } from '../entities/set-log.entity';

@Injectable()
export class WorkoutLogRepository implements WorkoutLogRepositoryPort {
    constructor(
        @InjectRepository(WorkoutLogEntity)
        private readonly repository: Repository<WorkoutLogEntity>,
    ) {}

    private toModel(entity: WorkoutLogEntity): WorkoutLogModel {
        return {
            id: entity.id,
            memberId: entity.memberId,
            assignmentId: entity.assignmentId ?? null,
            routineDayId: entity.routineDayId ?? null,
            dayLabel: entity.dayLabel ?? null,
            performedOn:
                typeof entity.performedOn === 'string'
                    ? entity.performedOn
                    : new Date(entity.performedOn).toISOString().slice(0, 10),
            status: entity.status,
            notes: entity.notes ?? null,
            createdAt: entity.createdAt,
            sets: (entity.sets ?? [])
                .slice()
                .sort((a, b) => a.setNumber - b.setNumber)
                .map((s) => ({
                    id: s.id,
                    routineExerciseId: s.routineExerciseId ?? null,
                    exerciseName: s.exerciseName,
                    setNumber: s.setNumber,
                    repsDone: s.repsDone ?? null,
                    weightDone:
                        s.weightDone === null || s.weightDone === undefined
                            ? null
                            : Number(s.weightDone),
                    durationDone: s.durationDone ?? null,
                    distanceDone:
                        s.distanceDone === null || s.distanceDone === undefined
                            ? null
                            : Number(s.distanceDone),
                    done: s.done,
                })),
        };
    }

    async create(payload: CreateWorkoutLogData): Promise<WorkoutLogModel> {
        const entity = this.repository.create({
            memberId: payload.memberId,
            assignmentId: payload.assignmentId ?? null,
            routineDayId: payload.routineDayId ?? null,
            dayLabel: payload.dayLabel ?? null,
            performedOn: payload.performedOn,
            status: payload.status ?? 'completed',
            notes: payload.notes ?? null,
            clientId: payload.clientId ?? null,
            sets: payload.sets.map((s) => {
                const setEntity = new SetLogEntity();
                setEntity.routineExerciseId = s.routineExerciseId ?? null;
                setEntity.exerciseName = s.exerciseName;
                setEntity.setNumber = s.setNumber;
                setEntity.repsDone = s.repsDone ?? null;
                setEntity.weightDone = s.weightDone ?? null;
                setEntity.durationDone = s.durationDone ?? null;
                setEntity.distanceDone = s.distanceDone ?? null;
                setEntity.done = s.done ?? true;
                return setEntity;
            }),
        });
        const saved = await this.repository.save(entity);
        const full = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['sets'],
        });
        return this.toModel(full ?? saved);
    }

    async findByMemberId(
        memberId: string,
        limit = 50,
    ): Promise<WorkoutLogModel[]> {
        const entities = await this.repository.find({
            where: { memberId },
            relations: ['sets'],
            order: { performedOn: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
        return entities.map((e) => this.toModel(e));
    }
}
