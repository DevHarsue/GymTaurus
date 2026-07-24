import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateRoutineDto } from '../../api/dtos/create-routine.dto';
import { UpdateRoutineDto } from '../../api/dtos/update-routine.dto';
import { SetMemberScheduleDto } from '../../api/dtos/set-member-schedule.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type MemberScheduleRepositoryPort,
    type ScheduledDay,
} from '../ports/member-schedule-repository.port';
import {
    type RoutineDetail,
    type RoutineModel,
    type RoutineRepositoryPort,
} from '../ports/routine-repository.port';

@Injectable()
export class RoutinesService {
    constructor(
        @Inject('RoutineRepositoryPort')
        private readonly routineRepository: RoutineRepositoryPort,
        @Inject('MemberScheduleRepositoryPort')
        private readonly scheduleRepository: MemberScheduleRepositoryPort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async createRoutine(
        payload: CreateRoutineDto,
        createdBy: string,
    ): Promise<RoutineDetail> {
        const routine = await this.routineRepository.create({
            ...payload,
            createdBy,
        });
        await this.eventPublisher.publish('members.routine.created', {
            id: routine.id,
        });
        return routine;
    }

    async listRoutines(): Promise<RoutineModel[]> {
        return this.routineRepository.findAll();
    }

    async getRoutine(id: string): Promise<RoutineDetail> {
        const routine = await this.routineRepository.findById(id);
        if (!routine) {
            throw new NotFoundException(`Rutina ${id} no encontrada`);
        }
        return routine;
    }

    async updateRoutine(
        id: string,
        payload: UpdateRoutineDto,
    ): Promise<RoutineDetail> {
        const routine = await this.routineRepository.update(id, payload);
        if (!routine) {
            throw new NotFoundException(`Rutina ${id} no encontrada`);
        }
        await this.eventPublisher.publish('members.routine.updated', { id });
        return routine;
    }

    async deleteRoutine(id: string): Promise<void> {
        const deleted = await this.routineRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Rutina ${id} no encontrada`);
        }
        await this.eventPublisher.publish('members.routine.deleted', { id });
    }

    // ─── Horario semanal del miembro ────────────────────────────────────

    /** Reemplaza el horario semanal de un miembro (cada día → rutina + día). */
    async setMemberSchedule(
        memberId: string,
        payload: SetMemberScheduleDto,
        assignedBy: string,
    ): Promise<ScheduledDay[]> {
        // Validar que cada día referenciado pertenezca a su rutina.
        const routineCache = new Map<string, RoutineDetail | null>();
        for (const entry of payload.entries) {
            let routine = routineCache.get(entry.routineId);
            if (routine === undefined) {
                routine = await this.routineRepository.findById(entry.routineId);
                routineCache.set(entry.routineId, routine);
            }
            if (!routine) {
                throw new NotFoundException(
                    `Rutina ${entry.routineId} no encontrada`,
                );
            }
            const valid = routine.days.some(
                (d) => d.id === entry.routineDayId,
            );
            if (!valid) {
                throw new BadRequestException(
                    `El día "${entry.weekday}" referencia un routine_day que no pertenece a la rutina`,
                );
            }
        }

        const schedule = await this.scheduleRepository.replaceForMember(
            memberId,
            payload.entries.map((e) => ({
                weekday: e.weekday,
                routineId: e.routineId,
                routineDayId: e.routineDayId,
            })),
            assignedBy,
        );

        await this.eventPublisher.publish('members.routine.scheduled', {
            memberId,
        });
        return schedule;
    }

    /** Horario semanal resuelto (rutina + día + ejercicios) de un miembro. */
    async getMemberSchedule(memberId: string): Promise<ScheduledDay[]> {
        return this.scheduleRepository.findByMemberId(memberId);
    }
}
