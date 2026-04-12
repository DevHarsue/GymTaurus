import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { MembershipPlanEntity } from './membership-plan.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity({ schema: 'members', name: 'renewals' })
export class RenewalEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'subscription_id' })
    subscriptionId!: string;

    @ManyToOne(
        () => SubscriptionEntity,
        (subscription) => subscription.renewals,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn({ name: 'subscription_id' })
    subscription!: SubscriptionEntity;

    @Column({ type: 'uuid', name: 'plan_id' })
    planId!: string;

    @ManyToOne(() => MembershipPlanEntity, (plan) => plan.renewals)
    @JoinColumn({ name: 'plan_id' })
    plan!: MembershipPlanEntity;

    @CreateDateColumn({ type: 'timestamp', name: 'renewed_at' })
    renewedAt!: Date;

    @Column({ type: 'timestamp', name: 'new_expires_at' })
    newExpiresAt!: Date;

    @Column({ type: 'uuid', name: 'renewed_by' })
    renewedBy!: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
}
