import { Injectable } from '@nestjs/common';
import { type EventPublisherPort } from '../../application/ports/event-publisher.port';

@Injectable()
export class RedisEventPublisher implements EventPublisherPort {
    async publish(topic: string, payload: unknown): Promise<void> {
        void topic;
        void payload;
        return Promise.resolve();
    }
}
