import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AccessService } from './services/access.service';
import { DevicesService } from './services/devices.service';

@Module({
    imports: [InfrastructureModule],
    providers: [AccessService, DevicesService],
    exports: [AccessService, DevicesService],
})
export class ApplicationModule {}
