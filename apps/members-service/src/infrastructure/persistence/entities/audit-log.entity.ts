import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'audit', name: 'audit_log' })
export class AuditLogEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: string;

    @Column({ type: 'text', name: 'table_schema' })
    tableSchema!: string;

    @Column({ type: 'text', name: 'table_name' })
    tableName!: string;

    @Column({ type: 'varchar', length: 10 })
    operation!: 'INSERT' | 'UPDATE' | 'DELETE';

    @Column({ type: 'text', name: 'row_id', nullable: true })
    rowId?: string | null;

    @Column({ type: 'uuid', name: 'actor_id', nullable: true })
    actorId?: string | null;

    @Column({ type: 'jsonb', name: 'old_data', nullable: true })
    oldData?: Record<string, unknown> | null;

    @Column({ type: 'jsonb', name: 'new_data', nullable: true })
    newData?: Record<string, unknown> | null;

    @Column({ type: 'timestamp', name: 'changed_at' })
    changedAt!: Date;
}
