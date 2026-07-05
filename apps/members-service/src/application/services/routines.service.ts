import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { AssignRoutineDto } from '../../api/dtos/assign-routine.dto';
import { CreateRoutineDto } from '../../api/dtos/create-routine.dto';
import { UpdateRoutineDto } from '../../api/dtos/update-routine.dto';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import {
    type RoutineAssignmentModel,
    type RoutineAssignmentRepositoryPort,
} from '../ports/routine-assignment-repository.port';
import {
    type RoutineDetail,
    type RoutineModel,
    type RoutineRepositoryPort,
} from '../ports/routine-repository.port';

/** Paquete que consume la app del miembro (offline-first). */
export interface MemberRoutineBundle {
    assignment: RoutineAssignmentModel | null;
    routine: RoutineDetail | null;
}

@Injectable()
export class RoutinesService {
    constructor(
        @Inject('RoutineRepositoryPort')
        private readonly routineRepository: RoutineRepositoryPort,
        @Inject('RoutineAssignmentRepositoryPort')
        private readonly assignmentRepository: RoutineAssignmentRepositoryPort,
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

    async assignRoutine(
        payload: AssignRoutineDto,
        assignedBy: string,
    ): Promise<RoutineAssignmentModel> {
        const routine = await this.routineRepository.findById(payload.routineId);
        if (!routine) {
            throw new NotFoundException(
                `Rutina ${payload.routineId} no encontrada`,
            );
        }

        // Validar que cada dia mapeado pertenezca a la rutina.
        const validDayIds = new Set(routine.days.map((d) => d.id));
        for (const [weekday, dayId] of Object.entries(payload.dayMapping)) {
            if (dayId && !validDayIds.has(dayId)) {
                throw new BadRequestException(
                    `El dia "${weekday}" referencia un routine_day (${dayId}) que no pertenece a la rutina`,
                );
            }
        }

        const assignment = await this.assignmentRepository.assign({
            memberId: payload.memberId,
            routineId: payload.routineId,
            assignedBy,
            dayMapping: payload.dayMapping,
            startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
            endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
        });

        await this.eventPublisher.publish('members.routine.assigned', {
            memberId: payload.memberId,
            routineId: payload.routineId,
            assignmentId: assignment.id,
        });
        return assignment;
    }

    async getMemberAssignment(
        memberId: string,
    ): Promise<RoutineAssignmentModel | null> {
        return this.assignmentRepository.findActiveByMemberId(memberId);
    }

    /** Bundle para la app del miembro: asignacion activa + rutina completa. */
    async getMemberBundle(memberId: string): Promise<MemberRoutineBundle> {
        const assignment =
            await this.assignmentRepository.findActiveByMemberId(memberId);
        if (!assignment) {
            return { assignment: null, routine: null };
        }
        const routine = await this.routineRepository.findById(
            assignment.routineId,
        );
        return { assignment, routine };
    }
}
