import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RoutineDayEntity } from './routine-day.entity';

@Entity({ schema: 'members', name: 'routine_exercises' })
export class RoutineExerciseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'routine_day_id' })
    routineDayId!: string;

    @ManyToOne(() => RoutineDayEntity, (day) => day.exercises, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'routine_day_id' })
    day!: RoutineDayEntity;

    @Column({ type: 'uuid', name: 'exercise_id', nullable: true })
    exerciseId?: string | null;

    @Column({ type: 'varchar', length: 150, name: 'exercise_name' })
    exerciseName!: string;

    @Column({ type: 'int', name: 'order_index', default: 0 })
    orderIndex!: number;

    @Column({ type: 'int', default: 3 })
    sets!: number;

    @Column({ type: 'varchar', length: 40, default: '10' })
    reps!: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    weight?: string | null;

    @Column({ type: 'int', name: 'rest_seconds', nullable: true })
    restSeconds?: number | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    rpe?: string | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;
}
