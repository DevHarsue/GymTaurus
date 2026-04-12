import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ schema: 'members', name: 'devices' })
export class DeviceEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', name: 'device_code', length: 50, unique: true })
    deviceCode!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location?: string;

    @Column({ type: 'varchar', length: 20, default: 'offline' })
    status!: string;

    @Column({ type: 'timestamp', name: 'last_seen_at', nullable: true })
    lastSeenAt?: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
}
