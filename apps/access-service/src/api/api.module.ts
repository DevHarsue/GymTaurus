import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { AccessController } from './controllers/access.controller';
import { DevicesController } from './controllers/devices.controller';
import { MqttGateway } from './mqtt.gateway';

@Module({
    imports: [ApplicationModule],
    controllers: [AccessController, DevicesController],
    providers: [MqttGateway],
})
export class ApiModule {}
