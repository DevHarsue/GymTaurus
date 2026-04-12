import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import {
    DEVICE_HEARTBEAT_JOB_NAME,
    DEVICE_HEARTBEAT_QUEUE_NAME,
} from '../../application/constants/device-heartbeat.constants';
import { DeviceHeartbeatMonitorService } from './device-heartbeat-monitor.service';

@Injectable()
@Processor(DEVICE_HEARTBEAT_QUEUE_NAME)
export class AccessProcessor {
    constructor(
        private readonly deviceHeartbeatMonitor: DeviceHeartbeatMonitorService,
    ) {}

    @Process(DEVICE_HEARTBEAT_JOB_NAME)
    async handleDeviceHeartbeat(): Promise<void> {
        await this.deviceHeartbeatMonitor.checkOfflineDevices();
    }
}
