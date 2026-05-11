import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type MemberStats,
    type SubscriptionStats,
    type RevenueStats,
    type RenewalStats,
    type StatisticsRepositoryPort,
} from '../../../application/ports/statistics-repository.port';
import { MemberEntity } from '../entities/member.entity';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { RenewalEntity } from '../entities/renewal.entity';
import { MembershipPlanEntity } from '../entities/membership-plan.entity';

@Injectable()
export class StatisticsRepository implements StatisticsRepositoryPort {
    constructor(
        @InjectRepository(MemberEntity)
        private readonly memberRepo: Repository<MemberEntity>,
        @InjectRepository(SubscriptionEntity)
        private readonly subscriptionRepo: Repository<SubscriptionEntity>,
        @InjectRepository(RenewalEntity)
        private readonly renewalRepo: Repository<RenewalEntity>,
        @InjectRepository(MembershipPlanEntity)
        private readonly planRepo: Repository<MembershipPlanEntity>,
    ) {}

    async getMemberStats(): Promise<MemberStats> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const totalMembers = await this.memberRepo.count();

        const activeMembers = await this.subscriptionRepo
            .createQueryBuilder('s')
            .select('COUNT(DISTINCT s.member_id)', 'count')
            .where('s.status = :status', { status: 'active' })
            .getRawOne()
            .then((r) => parseInt(r?.count ?? '0', 10));

        const inactiveMembers = totalMembers - activeMembers;

        const newMembersThisMonth = await this.memberRepo
            .createQueryBuilder('m')
            .where('m.created_at >= :start', { start: startOfMonth })
            .getCount();

        const newMembersLastMonth = await this.memberRepo
            .createQueryBuilder('m')
            .where('m.created_at >= :start AND m.created_at < :end', {
                start: startOfLastMonth,
                end: startOfMonth,
            })
            .getCount();

        return {
            totalMembers,
            activeMembers,
            inactiveMembers,
            newMembersThisMonth,
            newMembersLastMonth,
        };
    }

    async getSubscriptionStats(): Promise<SubscriptionStats> {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const statusCounts = await this.subscriptionRepo
            .createQueryBuilder('s')
            .select('s.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('s.status')
            .getRawMany();

        const getCount = (status: string) =>
            parseInt(
                statusCounts.find((r) => r.status === status)?.count ?? '0',
                10,
            );

        const expiringIn7Days = await this.subscriptionRepo
            .createQueryBuilder('s')
            .where('s.status = :status', { status: 'active' })
            .andWhere('s.expires_at BETWEEN :now AND :limit', {
                now,
                limit: in7Days,
            })
            .getCount();

        const planDistribution = await this.subscriptionRepo
            .createQueryBuilder('s')
            .innerJoin(MembershipPlanEntity, 'p', 'p.id = s.plan_id')
            .select('s.plan_id', 'planId')
            .addSelect('p.name', 'planName')
            .addSelect('COUNT(*)', 'count')
            .where('s.status = :status', { status: 'active' })
            .groupBy('s.plan_id')
            .addGroupBy('p.name')
            .getRawMany();

        return {
            totalActive: getCount('active'),
            totalExpired: getCount('expired'),
            totalCancelled: getCount('cancelled'),
            expiringIn7Days,
            planDistribution: planDistribution.map((r) => ({
                planId: r.planId,
                planName: r.planName,
                count: parseInt(r.count, 10),
            })),
        };
    }

    async getRevenueStats(): Promise<RevenueStats> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisMonthRevenue = await this.subscriptionRepo
            .createQueryBuilder('s')
            .innerJoin(MembershipPlanEntity, 'p', 'p.id = s.plan_id')
            .select('COALESCE(SUM(p.reference_price), 0)', 'total')
            .where('s.created_at >= :start', { start: startOfMonth })
            .getRawOne()
            .then((r) => parseFloat(r?.total ?? '0'));

        const lastMonthRevenue = await this.subscriptionRepo
            .createQueryBuilder('s')
            .innerJoin(MembershipPlanEntity, 'p', 'p.id = s.plan_id')
            .select('COALESCE(SUM(p.reference_price), 0)', 'total')
            .where('s.created_at >= :start AND s.created_at < :end', {
                start: startOfLastMonth,
                end: startOfMonth,
            })
            .getRawOne()
            .then((r) => parseFloat(r?.total ?? '0'));

        const revenueByPlan = await this.subscriptionRepo
            .createQueryBuilder('s')
            .innerJoin(MembershipPlanEntity, 'p', 'p.id = s.plan_id')
            .select('s.plan_id', 'planId')
            .addSelect('p.name', 'planName')
            .addSelect('COUNT(*)', 'subscriptionCount')
            .addSelect('COALESCE(SUM(p.reference_price), 0)', 'estimatedRevenue')
            .groupBy('s.plan_id')
            .addGroupBy('p.name')
            .getRawMany();

        return {
            estimatedThisMonth: thisMonthRevenue,
            estimatedLastMonth: lastMonthRevenue,
            revenueByPlan: revenueByPlan.map((r) => ({
                planId: r.planId,
                planName: r.planName,
                subscriptionCount: parseInt(r.subscriptionCount, 10),
                estimatedRevenue: parseFloat(r.estimatedRevenue),
            })),
        };
    }

    async getRenewalStats(): Promise<RenewalStats> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const totalRenewals = await this.renewalRepo.count();

        const renewalsThisMonth = await this.renewalRepo
            .createQueryBuilder('r')
            .where('r.renewed_at >= :start', { start: startOfMonth })
            .getCount();

        const renewalsLastMonth = await this.renewalRepo
            .createQueryBuilder('r')
            .where('r.renewed_at >= :start AND r.renewed_at < :end', {
                start: startOfLastMonth,
                end: startOfMonth,
            })
            .getCount();

        return {
            totalRenewals,
            renewalsThisMonth,
            renewalsLastMonth,
        };
    }
}
