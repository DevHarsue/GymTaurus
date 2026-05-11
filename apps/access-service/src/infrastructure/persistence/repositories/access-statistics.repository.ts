import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    type AccessOverview,
    type HourlyDistribution,
    type DailyDistribution,
    type TopMember,
    type DenialBreakdown,
    type AccessStatisticsRepositoryPort,
} from '../../../application/ports/access-statistics-repository.port';
import { AccessLog } from '../schemas/access-log.schema';

@Injectable()
export class AccessStatisticsRepository
    implements AccessStatisticsRepositoryPort
{
    private static readonly DAY_NAMES = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
    ];

    constructor(
        @InjectModel(AccessLog.name)
        private readonly accessLogModel: Model<AccessLog>,
    ) {}

    async getOverview(): Promise<AccessOverview> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalToday, totalWeek, totalMonth, deniedToday] =
            await Promise.all([
                this.accessLogModel.countDocuments({
                    timestamp: { $gte: startOfDay },
                    granted: true,
                }),
                this.accessLogModel.countDocuments({
                    timestamp: { $gte: startOfWeek },
                    granted: true,
                }),
                this.accessLogModel.countDocuments({
                    timestamp: { $gte: startOfMonth },
                    granted: true,
                }),
                this.accessLogModel.countDocuments({
                    timestamp: { $gte: startOfDay },
                    granted: false,
                }),
            ]);

        const totalAttemptsToday = totalToday + deniedToday;
        const denialRate =
            totalAttemptsToday > 0
                ? Math.round((deniedToday / totalAttemptsToday) * 10000) / 100
                : 0;

        return {
            totalAccessToday: totalToday,
            totalAccessThisWeek: totalWeek,
            totalAccessThisMonth: totalMonth,
            deniedToday,
            denialRate,
        };
    }

    async getHourlyDistribution(days: number): Promise<HourlyDistribution[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const result = await this.accessLogModel.aggregate<{
            _id: number;
            count: number;
        }>([
            {
                $match: {
                    timestamp: { $gte: since },
                    granted: true,
                },
            },
            {
                $group: {
                    _id: { $hour: '$timestamp' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const hourMap = new Map(result.map((r) => [r._id, r.count]));
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: hourMap.get(i) ?? 0,
        }));
    }

    async getDailyDistribution(weeks: number): Promise<DailyDistribution[]> {
        const since = new Date();
        since.setDate(since.getDate() - weeks * 7);

        const result = await this.accessLogModel.aggregate<{
            _id: number;
            count: number;
        }>([
            {
                $match: {
                    timestamp: { $gte: since },
                    granted: true,
                },
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$timestamp' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const dayMap = new Map(result.map((r) => [r._id, r.count]));
        return Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i + 1,
            dayName: AccessStatisticsRepository.DAY_NAMES[i] as string,
            count: dayMap.get(i + 1) ?? 0,
        }));
    }

    async getTopMembers(limit: number): Promise<TopMember[]> {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const result = await this.accessLogModel.aggregate<{
            _id: string;
            memberName: string;
            count: number;
        }>([
            {
                $match: {
                    timestamp: { $gte: since },
                    granted: true,
                    member_id: {
                        $ne: '00000000-0000-0000-0000-000000000000',
                    },
                },
            },
            {
                $group: {
                    _id: '$member_id',
                    memberName: { $last: '$member_name' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);

        return result.map((r) => ({
            memberId: r._id,
            memberName: r.memberName,
            visitCount: r.count,
        }));
    }

    async getDenialBreakdown(days: number): Promise<DenialBreakdown[]> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const result = await this.accessLogModel.aggregate<{
            _id: string;
            count: number;
        }>([
            {
                $match: {
                    timestamp: { $gte: since },
                    granted: false,
                },
            },
            {
                $group: {
                    _id: '$reason',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        return result.map((r) => ({
            reason: r._id,
            count: r.count,
        }));
    }
}
