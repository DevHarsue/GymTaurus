import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { RenewalEntity } from './renewal.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ schema: 'members', name: 'membership_plans' })
export class MembershipPlanEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    name!: string;

    @Column({ type: 'int', name: 'duration_days' })
    durationDays!: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        name: 'reference_price',
        default: 0,
    })
    referencePrice!: number;

    @Column({ type: 'boolean', name: 'is_active', default: true })
    isActive!: boolean;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => SubscriptionEntity, (subscription) => subscription.plan)
    subscriptions!: SubscriptionEntity[];

    @OneToMany(() => RenewalEntity, (renewal) => renewal.plan)
    renewals!: RenewalEntity[];
}
