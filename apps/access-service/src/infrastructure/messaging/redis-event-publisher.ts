import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { type EventPublisherPort } from '../../application/ports/event-publisher.port';

@Injectable()
export class RedisEventPublisher
    implements EventPublisherPort, OnModuleDestroy
{
    private readonly redis: Redis;

    constructor(configService: ConfigService) {
        this.redis = new Redis({
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            maxRetriesPerRequest: 1,
            lazyConnect: false,
        });
    }

    async publish(topic: string, payload: unknown): Promise<void> {
        await this.redis.publish(topic, JSON.stringify(payload));
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis.quit();
    }
}
