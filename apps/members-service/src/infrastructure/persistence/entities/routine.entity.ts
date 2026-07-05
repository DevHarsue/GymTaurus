import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RoutineDayEntity } from './routine-day.entity';

@Entity({ schema: 'members', name: 'routines' })
export class RoutineEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 150 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'varchar', length: 20, default: 'beginner' })
    level!: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    goal?: string | null;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ type: 'uuid', name: 'created_by', nullable: true })
    createdBy?: string | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => RoutineDayEntity, (day) => day.routine, { cascade: true })
    days!: RoutineDayEntity[];
}
