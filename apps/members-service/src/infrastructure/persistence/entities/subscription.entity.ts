import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { MemberEntity } from './member.entity';
import { MembershipPlanEntity } from './membership-plan.entity';
import { RenewalEntity } from './renewal.entity';

@Entity({ schema: 'members', name: 'subscriptions' })
export class SubscriptionEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'member_id' })
    memberId!: string;

    @ManyToOne(() => MemberEntity, (member) => member.subscriptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'member_id' })
    member!: MemberEntity;

    @Column({ type: 'uuid', name: 'plan_id' })
    planId!: string;

    @ManyToOne(() => MembershipPlanEntity, (plan) => plan.subscriptions)
    @JoinColumn({ name: 'plan_id' })
    plan!: MembershipPlanEntity;

    @Column({ type: 'varchar', length: 20, default: 'expired' })
    status!: string;

    @Column({ type: 'timestamp', name: 'starts_at' })
    startsAt!: Date;

    @Column({ type: 'timestamp', name: 'expires_at' })
    expiresAt!: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => RenewalEntity, (renewal) => renewal.subscription)
    renewals!: RenewalEntity[];
}
