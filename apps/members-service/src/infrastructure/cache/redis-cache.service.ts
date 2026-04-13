import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { type CachePort } from '../../application/ports/cache.port';

@Injectable()
export class RedisCacheService
    implements CachePort, OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(RedisCacheService.name);
    private client!: Redis;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit(): void {
        this.client = new Redis({
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
            lazyConnect: true,
        });

        this.client.on('connect', () =>
            this.logger.log('Redis cache connected'),
        );
        this.client.on('error', (err: Error) =>
            this.logger.error(`Redis cache error: ${err.message}`),
        );
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.client.set(key, value);
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }
}
