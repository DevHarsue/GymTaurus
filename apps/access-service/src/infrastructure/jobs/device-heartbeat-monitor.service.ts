import { Inject, Injectable } from '@nestjs/common';
import {
    DEVICE_HEARTBEAT_KNOWN_SET_KEY,
    DEVICE_HEARTBEAT_LAST_SEEN_PREFIX,
    DEVICE_HEARTBEAT_OFFLINE_NOTICE_PREFIX,
    DEVICE_HEARTBEAT_OFFLINE_THRESHOLD_SECONDS,
} from '../../application/constants/device-heartbeat.constants';
import { type CachePort } from '../../application/ports/cache.port';
import { type EventPublisherPort } from '../../application/ports/event-publisher.port';

@Injectable()
export class DeviceHeartbeatMonitorService {
    constructor(
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async checkOfflineDevices(): Promise<void> {
        const now = Date.now();
        const knownDevicesRaw = await this.cache.get(
            DEVICE_HEARTBEAT_KNOWN_SET_KEY,
        );
        const knownDevices = knownDevicesRaw
            ? knownDevicesRaw.split(',').filter(Boolean)
            : [];

        for (const deviceId of knownDevices) {
            const lastSeenRaw = await this.cache.get(
                `${DEVICE_HEARTBEAT_LAST_SEEN_PREFIX}${deviceId}`,
            );
            if (!lastSeenRaw) {
                continue;
            }

            const lastSeen = Number(lastSeenRaw);
            if (Number.isNaN(lastSeen)) {
                continue;
            }

            const elapsedSeconds = Math.floor((now - lastSeen) / 1000);
            if (elapsedSeconds < DEVICE_HEARTBEAT_OFFLINE_THRESHOLD_SECONDS) {
                continue;
            }

            const noticeKey = `${DEVICE_HEARTBEAT_OFFLINE_NOTICE_PREFIX}${deviceId}`;
            const alreadyNotifiedRaw = await this.cache.get(noticeKey);
            const alreadyNotifiedAt = alreadyNotifiedRaw
                ? Number(alreadyNotifiedRaw)
                : 0;

            if (alreadyNotifiedAt >= lastSeen) {
                continue;
            }

            await this.eventPublisher.publish('device:offline', {
                deviceId,
                lastSeenAt: new Date(lastSeen).toISOString(),
            });

            await this.cache.set(noticeKey, String(now), 3600);
        }
    }
}
