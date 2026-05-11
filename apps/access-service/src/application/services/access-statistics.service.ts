import { Inject, Injectable } from '@nestjs/common';
import { type AccessStatisticsRepositoryPort } from '../ports/access-statistics-repository.port';

@Injectable()
export class AccessStatisticsService {
    constructor(
        @Inject('AccessStatisticsRepositoryPort')
        private readonly statsRepo: AccessStatisticsRepositoryPort,
    ) {}

    async getDashboard() {
        const [overview, hourly, daily, topMembers, denials] =
            await Promise.all([
                this.statsRepo.getOverview(),
                this.statsRepo.getHourlyDistribution(30),
                this.statsRepo.getDailyDistribution(4),
                this.statsRepo.getTopMembers(10),
                this.statsRepo.getDenialBreakdown(30),
            ]);

        return { overview, hourly, daily, topMembers, denials };
    }

    async getOverview() {
        return this.statsRepo.getOverview();
    }

    async getHourlyDistribution(days: number) {
        return this.statsRepo.getHourlyDistribution(days);
    }

    async getDailyDistribution(weeks: number) {
        return this.statsRepo.getDailyDistribution(weeks);
    }

    async getTopMembers(limit: number) {
        return this.statsRepo.getTopMembers(limit);
    }

    async getDenialBreakdown(days: number) {
        return this.statsRepo.getDenialBreakdown(days);
    }
}
