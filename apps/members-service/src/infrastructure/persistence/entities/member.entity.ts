import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ schema: 'members', name: 'members' })
export class MemberEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'user_id', unique: true })
    userId!: string;

    @Column({ type: 'uuid', name: 'created_by' })
    createdBy!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    cedula!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({
        type: 'int',
        name: 'fingerprint_id',
        unique: true,
        nullable: true,
    })
    fingerprintId?: number;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => SubscriptionEntity, (subscription) => subscription.member)
    subscriptions!: SubscriptionEntity[];
}
