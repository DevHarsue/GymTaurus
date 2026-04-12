import { Inject, Injectable } from '@nestjs/common';
import { type DeviceHeartbeatDto } from '../../api/dtos/device-heartbeat.dto';
import { RegisterDeviceDto } from '../../api/dtos/register-device.dto';
import {
    DEVICE_HEARTBEAT_KNOWN_SET_KEY,
    DEVICE_HEARTBEAT_LAST_SEEN_PREFIX,
} from '../constants/device-heartbeat.constants';
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

    async registerHeartbeat(payload: DeviceHeartbeatDto): Promise<void> {
        const now = Date.now();
        await this.cache.set(
            `${DEVICE_HEARTBEAT_LAST_SEEN_PREFIX}${payload.device_id}`,
            String(now),
            3600,
        );

        const knownDevicesRaw = await this.cache.get(
            DEVICE_HEARTBEAT_KNOWN_SET_KEY,
        );
        const knownDevices = knownDevicesRaw
            ? knownDevicesRaw.split(',').filter(Boolean)
            : [];

        if (!knownDevices.includes(payload.device_id)) {
            knownDevices.push(payload.device_id);
            await this.cache.set(
                DEVICE_HEARTBEAT_KNOWN_SET_KEY,
                knownDevices.join(','),
                86400,
            );
        }
    }
}
