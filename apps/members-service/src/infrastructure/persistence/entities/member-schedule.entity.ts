import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { MemberEntity } from './member.entity';
import { RoutineEntity } from './routine.entity';
import { RoutineDayEntity } from './routine-day.entity';

/**
 * Horario semanal del miembro: cada dia de la semana puede apuntar a una
 * rutina y a un dia concreto de esa rutina. Sin fila = descanso. Dias
 * distintos pueden usar rutinas distintas. Unico por (member_id, weekday).
 */
@Entity({ schema: 'members', name: 'member_schedule' })
export class MemberScheduleEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'member_id' })
    memberId!: string;

    @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'member_id' })
    member!: MemberEntity;

    @Column({ type: 'varchar', length: 10 })
    weekday!: string;

    @Column({ type: 'uuid', name: 'routine_id' })
    routineId!: string;

    @ManyToOne(() => RoutineEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'routine_id' })
    routine!: RoutineEntity;

    @Column({ type: 'uuid', name: 'routine_day_id' })
    routineDayId!: string;

    @ManyToOne(() => RoutineDayEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'routine_day_id' })
    routineDay!: RoutineDayEntity;

    @Column({ type: 'uuid', name: 'assigned_by', nullable: true })
    assignedBy?: string | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;
}
