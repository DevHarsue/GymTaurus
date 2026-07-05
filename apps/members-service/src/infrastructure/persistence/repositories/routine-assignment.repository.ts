import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type CreateAssignmentData,
    type RoutineAssignmentModel,
    type RoutineAssignmentRepositoryPort,
} from '../../../application/ports/routine-assignment-repository.port';
import { RoutineAssignmentEntity } from '../entities/routine-assignment.entity';

@Injectable()
export class RoutineAssignmentRepository
    implements RoutineAssignmentRepositoryPort
{
    constructor(
        @InjectRepository(RoutineAssignmentEntity)
        private readonly repository: Repository<RoutineAssignmentEntity>,
    ) {}

    private toModel(entity: RoutineAssignmentEntity): RoutineAssignmentModel {
        return {
            id: entity.id,
            memberId: entity.memberId,
            routineId: entity.routineId,
            assignedBy: entity.assignedBy ?? null,
            dayMapping: entity.dayMapping ?? {},
            startsAt: entity.startsAt,
            endsAt: entity.endsAt ?? null,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    async assign(
        payload: CreateAssignmentData,
    ): Promise<RoutineAssignmentModel> {
        return this.repository.manager.transaction(async (manager) => {
            // Cerrar la asignacion activa previa (unique parcial: 1 activa/miembro).
            await manager.update(
                RoutineAssignmentEntity,
                { memberId: payload.memberId, status: 'active' },
                { status: 'finished' },
            );

            const entity = manager.create(RoutineAssignmentEntity, {
                memberId: payload.memberId,
                routineId: payload.routineId,
                assignedBy: payload.assignedBy ?? null,
                dayMapping: payload.dayMapping,
                startsAt: payload.startsAt,
                endsAt: payload.endsAt ?? null,
                status: 'active',
            });
            const saved = await manager.save(entity);
            return this.toModel(saved);
        });
    }

    async findActiveByMemberId(
        memberId: string,
    ): Promise<RoutineAssignmentModel | null> {
        const entity = await this.repository.findOne({
            where: { memberId, status: 'active' },
            order: { createdAt: 'DESC' },
        });
        return entity ? this.toModel(entity) : null;
    }

    async findByMemberId(memberId: string): Promise<RoutineAssignmentModel[]> {
        const entities = await this.repository.find({
            where: { memberId },
            order: { createdAt: 'DESC' },
        });
        return entities.map((e) => this.toModel(e));
    }

    async findById(id: string): Promise<RoutineAssignmentModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toModel(entity) : null;
    }

    async deactivate(id: string): Promise<boolean> {
        const result = await this.repository.update(id, { status: 'finished' });
        return (result.affected ?? 0) > 0;
    }
}
