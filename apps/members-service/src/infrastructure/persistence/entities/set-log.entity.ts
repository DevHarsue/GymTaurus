import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkoutLogEntity } from './workout-log.entity';

@Entity({ schema: 'members', name: 'set_logs' })
export class SetLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'workout_log_id' })
    workoutLogId!: string;

    @ManyToOne(() => WorkoutLogEntity, (log) => log.sets, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'workout_log_id' })
    workoutLog!: WorkoutLogEntity;

    @Column({ type: 'uuid', name: 'routine_exercise_id', nullable: true })
    routineExerciseId?: string | null;

    @Column({ type: 'varchar', length: 150, name: 'exercise_name' })
    exerciseName!: string;

    @Column({ type: 'int', name: 'set_number', default: 1 })
    setNumber!: number;

    @Column({ type: 'int', name: 'reps_done', nullable: true })
    repsDone?: number | null;

    @Column({
        type: 'decimal',
        precision: 7,
        scale: 2,
        name: 'weight_done',
        nullable: true,
    })
    weightDone?: number | null;

    @Column({ type: 'int', name: 'duration_done', nullable: true })
    durationDone?: number | null;

    @Column({
        type: 'decimal',
        precision: 8,
        scale: 2,
        name: 'distance_done',
        nullable: true,
    })
    distanceDone?: number | null;

    @Column({ type: 'boolean', default: true })
    done!: boolean;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
}
