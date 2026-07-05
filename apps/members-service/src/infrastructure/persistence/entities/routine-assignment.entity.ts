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

/** Mapeo dia de semana -> id del routine_day. Las claves ausentes son descanso. */
export type DayMapping = Partial<Record<
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday',
    string
>>;

@Entity({ schema: 'members', name: 'routine_assignments' })
export class RoutineAssignmentEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'member_id' })
    memberId!: string;

    @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'member_id' })
    member!: MemberEntity;

    @Column({ type: 'uuid', name: 'routine_id' })
    routineId!: string;

    @ManyToOne(() => RoutineEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'routine_id' })
    routine!: RoutineEntity;

    @Column({ type: 'uuid', name: 'assigned_by', nullable: true })
    assignedBy?: string | null;

    @Column({ type: 'jsonb', name: 'day_mapping', default: () => "'{}'" })
    dayMapping!: DayMapping;

    @Column({ type: 'timestamp', name: 'starts_at' })
    startsAt!: Date;

    @Column({ type: 'timestamp', name: 'ends_at', nullable: true })
    endsAt?: Date | null;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status!: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;
}
