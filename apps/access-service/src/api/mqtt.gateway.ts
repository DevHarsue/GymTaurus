import { Injectable } from '@nestjs/common';

@Injectable()
export class MqttGateway {
    handleMessage(topic: string, payload: string): void {
        void topic;
        void payload;
        return;
    }
}
