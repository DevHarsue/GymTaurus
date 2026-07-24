import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type MemberScheduleRepositoryPort,
    type ScheduleEntryData,
    type ScheduledDay,
} from '../../../application/ports/member-schedule-repository.port';
import { MemberScheduleEntity } from '../entities/member-schedule.entity';

const WEEKDAY_ORDER: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
};

@Injectable()
export class MemberScheduleRepository implements MemberScheduleRepositoryPort {
    constructor(
        @InjectRepository(MemberScheduleEntity)
        private readonly repository: Repository<MemberScheduleEntity>,
    ) {}

    private toScheduledDay(entity: MemberScheduleEntity): ScheduledDay {
        const day = entity.routineDay;
        return {
            weekday: entity.weekday,
            routineId: entity.routineId,
            routineName: entity.routine?.name ?? '',
            routineDayId: entity.routineDayId,
            dayLabel: day?.label ?? '',
            exercises: (day?.exercises ?? [])
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((ex) => ({
                    id: ex.id,
                    routineDayId: ex.routineDayId,
                    exerciseId: ex.exerciseId ?? null,
                    exerciseName: ex.exerciseName,
                    measurementType: ex.measurementType,
                    orderIndex: ex.orderIndex,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight ?? null,
                    durationSeconds: ex.durationSeconds ?? null,
                    distance: ex.distance ?? null,
                    restSeconds: ex.restSeconds ?? null,
                    rpe: ex.rpe ?? null,
                    notes: ex.notes ?? null,
                })),
        };
    }

    async findByMemberId(memberId: string): Promise<ScheduledDay[]> {
        const rows = await this.repository.find({
            where: { memberId },
            relations: ['routine', 'routineDay', 'routineDay.exercises'],
        });
        return rows
            .map((r) => this.toScheduledDay(r))
            .sort(
                (a, b) =>
                    (WEEKDAY_ORDER[a.weekday] ?? 99) -
                    (WEEKDAY_ORDER[b.weekday] ?? 99),
            );
    }

    async deleteByRoutineId(routineId: string): Promise<void> {
        await this.repository.delete({ routineId });
    }

    async replaceForMember(
        memberId: string,
        entries: ScheduleEntryData[],
        assignedBy?: string,
    ): Promise<ScheduledDay[]> {
        await this.repository.manager.transaction(async (manager) => {
            await manager.delete(MemberScheduleEntity, { memberId });
            if (entries.length > 0) {
                const rows = entries.map((e) =>
                    manager.create(MemberScheduleEntity, {
                        memberId,
                        weekday: e.weekday,
                        routineId: e.routineId,
                        routineDayId: e.routineDayId,
                        assignedBy: assignedBy ?? null,
                    }),
                );
                await manager.save(MemberScheduleEntity, rows);
            }
        });
        return this.findByMemberId(memberId);
    }
}
