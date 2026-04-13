import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { type CachePort } from '../../application/ports/cache.port';

@Injectable()
export class RedisCacheService implements CachePort, OnModuleDestroy {
    private readonly redis: Redis;

    constructor(configService: ConfigService) {
        this.redis = new Redis({
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            maxRetriesPerRequest: 1,
            lazyConnect: false,
        });
    }

    get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds && ttlSeconds > 0) {
            return this.redis
                .set(key, value, 'EX', ttlSeconds)
                .then(() => undefined);
        }

        return this.redis.set(key, value).then(() => undefined);
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit();
    }
}
