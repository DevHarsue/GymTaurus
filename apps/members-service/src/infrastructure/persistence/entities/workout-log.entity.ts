import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SetLogEntity } from './set-log.entity';

@Entity({ schema: 'members', name: 'workout_logs' })
export class WorkoutLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'member_id' })
    memberId!: string;

    @Column({ type: 'uuid', name: 'assignment_id', nullable: true })
    assignmentId?: string | null;

    @Column({ type: 'uuid', name: 'routine_day_id', nullable: true })
    routineDayId?: string | null;

    @Column({ type: 'varchar', length: 120, name: 'day_label', nullable: true })
    dayLabel?: string | null;

    @Column({ type: 'date', name: 'performed_on' })
    performedOn!: string;

    @Column({ type: 'varchar', length: 20, default: 'completed' })
    status!: string;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @Column({ type: 'uuid', name: 'client_id', nullable: true })
    clientId?: string | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => SetLogEntity, (set) => set.workoutLog, { cascade: true })
    sets!: SetLogEntity[];
}
