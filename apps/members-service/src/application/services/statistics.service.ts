import { Inject, Injectable } from '@nestjs/common';
import { type StatisticsRepositoryPort } from '../ports/statistics-repository.port';

@Injectable()
export class StatisticsService {
    constructor(
        @Inject('StatisticsRepositoryPort')
        private readonly statisticsRepo: StatisticsRepositoryPort,
    ) {}

    async getDashboard() {
        const [members, subscriptions, revenue, renewals] = await Promise.all([
            this.statisticsRepo.getMemberStats(),
            this.statisticsRepo.getSubscriptionStats(),
            this.statisticsRepo.getRevenueStats(),
            this.statisticsRepo.getRenewalStats(),
        ]);

        return { members, subscriptions, revenue, renewals };
    }

    async getMemberStats() {
        return this.statisticsRepo.getMemberStats();
    }

    async getSubscriptionStats() {
        return this.statisticsRepo.getSubscriptionStats();
    }

    async getRevenueStats() {
        return this.statisticsRepo.getRevenueStats();
    }

    async getRenewalStats() {
        return this.statisticsRepo.getRenewalStats();
    }
}
