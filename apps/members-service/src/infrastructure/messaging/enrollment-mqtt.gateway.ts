import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { type MqttClient } from 'mqtt';
import {
    type EnrollDeletePayload,
    type EnrollProgressListener,
    type EnrollProgressPayload,
    type EnrollRequestPayload,
    type EnrollmentMqttPort,
} from '../../application/ports/enrollment-mqtt.port';

const TOPIC_ENROLL_REQUEST = 'gym/enroll/request';
const TOPIC_ENROLL_RESPONSE = 'gym/enroll/response';
const TOPIC_ENROLL_DELETE = 'gym/enroll/delete';

@Injectable()
export class EnrollmentMqttGateway
    implements EnrollmentMqttPort, OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(EnrollmentMqttGateway.name);
    private client: MqttClient | null = null;
    private listeners = new Set<EnrollProgressListener>();

    constructor(private readonly configService: ConfigService) {}

    onModuleInit(): void {
        const mqttUrl = this.configService.get<string>(
            'MQTT_URL',
            'mqtt://localhost:1883',
        );

        this.client = mqtt.connect(mqttUrl, { reconnectPeriod: 2000 });

        this.client.on('connect', () => {
            this.logger.log(`MQTT (members) conectado a ${mqttUrl}`);
            this.client?.subscribe(TOPIC_ENROLL_RESPONSE);
        });

        this.client.on('message', (topic, payload) => {
            if (topic !== TOPIC_ENROLL_RESPONSE) return;
            this.handleProgress(payload.toString('utf-8'));
        });

        this.client.on('error', (error) => {
            this.logger.error(`Error MQTT (members): ${error.message}`);
        });
    }

    async onModuleDestroy(): Promise<void> {
        if (!this.client) return;
        await new Promise<void>((resolve) => {
            this.client?.end(false, {}, () => resolve());
        });
    }

    publishEnrollRequest(payload: EnrollRequestPayload): void {
        this.client?.publish(TOPIC_ENROLL_REQUEST, JSON.stringify(payload));
    }

    publishEnrollDelete(payload: EnrollDeletePayload): void {
        this.client?.publish(TOPIC_ENROLL_DELETE, JSON.stringify(payload));
    }

    onEnrollProgress(listener: EnrollProgressListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private handleProgress(rawPayload: string): void {
        let parsed: EnrollProgressPayload | null = null;
        try {
            const json = JSON.parse(rawPayload) as Record<string, unknown>;
            if (
                typeof json.member_id !== 'string' ||
                typeof json.fingerprint_id !== 'number' ||
                typeof json.device_id !== 'string' ||
                typeof json.step !== 'string' ||
                typeof json.status !== 'string'
            ) {
                return;
            }
            parsed = {
                member_id: json.member_id,
                fingerprint_id: json.fingerprint_id,
                device_id: json.device_id,
                step: json.step,
                status: json.status,
                message: typeof json.message === 'string' ? json.message : '',
            };
        } catch {
            return;
        }

        if (!parsed) return;
        for (const listener of this.listeners) {
            try {
                listener(parsed);
            } catch (error) {
                this.logger.error(
                    `Listener de enroll falló: ${(error as Error).message}`,
                );
            }
        }
    }
}
