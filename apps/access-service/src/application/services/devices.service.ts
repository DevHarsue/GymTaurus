import { Inject, Injectable } from '@nestjs/common';
import { RegisterDeviceDto } from '../../api/dtos/register-device.dto';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';

@Injectable()
export class DevicesService {
    constructor(
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async register(payload: RegisterDeviceDto): Promise<RegisterDeviceDto> {
        await this.cache.set(
            `device:${payload.deviceCode}`,
            JSON.stringify(payload),
            300,
        );
        await this.eventPublisher.publish('access.device.registered', payload);
        return payload;
    }
}
