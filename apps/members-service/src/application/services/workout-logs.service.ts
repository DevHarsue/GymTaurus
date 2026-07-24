import { Inject, Injectable } from '@nestjs/common';
import { LogWorkoutDto } from '../../api/dtos/log-workout.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type WorkoutLogModel,
    type WorkoutLogRepositoryPort,
} from '../ports/workout-log-repository.port';

@Injectable()
export class WorkoutLogsService {
    constructor(
        @Inject('WorkoutLogRepositoryPort')
        private readonly workoutLogRepository: WorkoutLogRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async logWorkout(
        memberId: string,
        payload: LogWorkoutDto,
    ): Promise<WorkoutLogModel> {
        const performedOn =
            payload.performedOn ?? new Date().toISOString().slice(0, 10);

        const log = await this.workoutLogRepository.create({
            memberId,
            assignmentId: payload.assignmentId,
            routineDayId: payload.routineDayId,
            dayLabel: payload.dayLabel,
            performedOn,
            status: payload.status,
            notes: payload.notes,
            clientId: payload.clientId,
            sets: payload.sets.map((s) => ({
                routineExerciseId: s.routineExerciseId,
                exerciseName: s.exerciseName,
                setNumber: s.setNumber,
                repsDone: s.repsDone,
                weightDone: s.weightDone,
                durationDone: s.durationDone,
                distanceDone: s.distanceDone,
                done: s.done,
            })),
        });

        await this.eventPublisher.publish('members.workout.logged', {
            memberId,
            workoutLogId: log.id,
            performedOn,
        });
        return log;
    }

    async getHistory(
        memberId: string,
        limit?: number,
    ): Promise<WorkoutLogModel[]> {
        return this.workoutLogRepository.findByMemberId(memberId, limit);
    }
}
