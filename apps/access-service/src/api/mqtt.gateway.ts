import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { type MqttClient } from 'mqtt';
import { AccessService } from '../application/services/access.service';
import { DevicesService } from '../application/services/devices.service';
import { type DeviceHeartbeatDto } from './dtos/device-heartbeat.dto';
import { type MqttAccessRequestDto } from './dtos/mqtt-access-request.dto';

@Injectable()
export class MqttGateway implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MqttGateway.name);
    private client: MqttClient | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly accessService: AccessService,
        private readonly devicesService: DevicesService,
    ) {}

    onModuleInit(): void {
        const mqttUrl = this.configService.get<string>(
            'MQTT_URL',
            'mqtt://localhost:1883',
        );

        this.client = mqtt.connect(mqttUrl, {
            reconnectPeriod: 2000,
        });

        this.client.on('connect', () => {
            this.logger.log(`MQTT conectado a ${mqttUrl}`);
            this.client?.subscribe([
                'gym/access/request',
                'gym/device/heartbeat',
            ]);
        });

        this.client.on('message', (topic, payload) => {
            void this.routeMessage(topic, payload.toString('utf-8'));
        });

        this.client.on('error', (error) => {
            this.logger.error(`Error MQTT: ${error.message}`);
        });
    }

    async onModuleDestroy(): Promise<void> {
        if (!this.client) {
            return;
        }

        await new Promise<void>((resolve) => {
            this.client?.end(false, {}, () => resolve());
        });
    }

    private async routeMessage(topic: string, payload: string): Promise<void> {
        if (topic === 'gym/access/request') {
            await this.handleAccessRequest(payload);
            return;
        }

        if (topic === 'gym/device/heartbeat') {
            await this.handleDeviceHeartbeat(payload);
        }
    }

    private async handleAccessRequest(payload: string): Promise<void> {
        const parsed = this.parseAccessRequest(payload);
        if (!parsed) {
            this.logger.warn(
                `Payload invalido en gym/access/request: ${payload}`,
            );
            return;
        }

        const result =
            await this.accessService.processMqttAccessRequest(parsed);
        this.client?.publish('gym/access/response', JSON.stringify(result));
    }

    private async handleDeviceHeartbeat(payload: string): Promise<void> {
        const parsed = this.parseDeviceHeartbeat(payload);
        if (!parsed) {
            this.logger.warn(
                `Payload invalido en gym/device/heartbeat: ${payload}`,
            );
            return;
        }

        await this.devicesService.registerHeartbeat(parsed);
    }

    private parseAccessRequest(payload: string): MqttAccessRequestDto | null {
        const parsed = this.parseJson(payload);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const record = parsed as Record<string, unknown>;
        const fingerprint = record.fingerprint_id;
        const timestamp = record.timestamp;
        const deviceId = record.device_id;

        if (
            typeof fingerprint !== 'number' ||
            typeof timestamp !== 'string' ||
            typeof deviceId !== 'string'
        ) {
            return null;
        }

        return {
            fingerprint_id: fingerprint,
            timestamp,
            device_id: deviceId,
        };
    }

    private parseDeviceHeartbeat(payload: string): DeviceHeartbeatDto | null {
        const parsed = this.parseJson(payload);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const record = parsed as Record<string, unknown>;
        const deviceId = record.device_id;
        const uptime = record.uptime;

        if (typeof deviceId !== 'string' || typeof uptime !== 'number') {
            return null;
        }

        return {
            device_id: deviceId,
            uptime,
        };
    }

    private parseJson(payload: string): unknown {
        try {
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }
}
