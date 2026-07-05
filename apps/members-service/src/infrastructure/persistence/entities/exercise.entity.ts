import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'members', name: 'exercises' })
export class ExerciseEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 150 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'varchar', length: 60, name: 'muscle_group', nullable: true })
    muscleGroup?: string | null;

    @Column({ type: 'varchar', length: 80, nullable: true })
    equipment?: string | null;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive!: boolean;

    @Column({ type: 'uuid', name: 'created_by', nullable: true })
    createdBy?: string | null;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;
}
