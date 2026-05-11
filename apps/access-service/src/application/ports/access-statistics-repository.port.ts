export interface AccessOverview {
    totalAccessToday: number;
    totalAccessThisWeek: number;
    totalAccessThisMonth: number;
    deniedToday: number;
    denialRate: number;
}

export interface HourlyDistribution {
    hour: number;
    count: number;
}

export interface DailyDistribution {
    dayOfWeek: number;
    dayName: string;
    count: number;
}

export interface TopMember {
    memberId: string;
    memberName: string;
    visitCount: number;
}

export interface DenialBreakdown {
    reason: string;
    count: number;
}

export interface AccessStatisticsRepositoryPort {
    getOverview(): Promise<AccessOverview>;
    getHourlyDistribution(days: number): Promise<HourlyDistribution[]>;
    getDailyDistribution(weeks: number): Promise<DailyDistribution[]>;
    getTopMembers(limit: number): Promise<TopMember[]>;
    getDenialBreakdown(days: number): Promise<DenialBreakdown[]>;
}
