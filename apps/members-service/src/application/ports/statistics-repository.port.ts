export interface MemberStats {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembersThisMonth: number;
    newMembersLastMonth: number;
}

export interface SubscriptionStats {
    totalActive: number;
    totalExpired: number;
    totalCancelled: number;
    expiringIn7Days: number;
    planDistribution: Array<{
        planId: string;
        planName: string;
        count: number;
    }>;
}

export interface RevenueStats {
    estimatedThisMonth: number;
    estimatedLastMonth: number;
    revenueByPlan: Array<{
        planId: string;
        planName: string;
        subscriptionCount: number;
        estimatedRevenue: number;
    }>;
}

export interface RenewalStats {
    totalRenewals: number;
    renewalsThisMonth: number;
    renewalsLastMonth: number;
}

export interface StatisticsRepositoryPort {
    getMemberStats(): Promise<MemberStats>;
    getSubscriptionStats(): Promise<SubscriptionStats>;
    getRevenueStats(): Promise<RevenueStats>;
    getRenewalStats(): Promise<RenewalStats>;
}
