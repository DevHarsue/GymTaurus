import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RoutineEntity } from './routine.entity';
import { RoutineExerciseEntity } from './routine-exercise.entity';

@Entity({ schema: 'members', name: 'routine_days' })
export class RoutineDayEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'routine_id' })
    routineId!: string;

    @ManyToOne(() => RoutineEntity, (routine) => routine.days, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'routine_id' })
    routine!: RoutineEntity;

    @Column({ type: 'varchar', length: 120 })
    label!: string;

    @Column({ type: 'int', name: 'order_index', default: 0 })
    orderIndex!: number;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => RoutineExerciseEntity, (ex) => ex.day, { cascade: true })
    exercises!: RoutineExerciseEntity[];
}
