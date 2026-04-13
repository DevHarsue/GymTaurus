import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { type EventPublisherPort } from '../../application/ports/event-publisher.port';

@Injectable()
export class RedisEventPublisher
    implements EventPublisherPort, OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(RedisEventPublisher.name);
    private publisher!: Redis;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit(): void {
        this.publisher = new Redis({
            host: this.configService.get<string>('REDIS_HOST', 'localhost'),
            port: this.configService.get<number>('REDIS_PORT', 6379),
            lazyConnect: true,
        });

        this.publisher.on('connect', () =>
            this.logger.log('Redis publisher connected'),
        );
        this.publisher.on('error', (err: Error) =>
            this.logger.error(`Redis publisher error: ${err.message}`),
        );
    }

    async onModuleDestroy(): Promise<void> {
        await this.publisher.quit();
    }

    async publish(topic: string, payload: unknown): Promise<void> {
        const message = JSON.stringify(payload);
        await this.publisher.publish(topic, message);
        this.logger.debug(`Published to [${topic}]: ${message}`);
    }
}
