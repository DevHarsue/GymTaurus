import { Injectable } from '@nestjs/common';
import { type CachePort } from '../../application/ports/cache.port';

@Injectable()
export class RedisCacheService implements CachePort {
    private readonly cache = new Map<string, string>();

    get(key: string): Promise<string | null> {
        return Promise.resolve(this.cache.get(key) ?? null);
    }

    set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        void ttlSeconds;
        this.cache.set(key, value);
        return Promise.resolve();
    }
}
