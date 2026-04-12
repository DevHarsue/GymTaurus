import { Body, Controller, Post } from '@nestjs/common';
import { DevicesService } from '../../application/services/devices.service';
import { RegisterDeviceDto } from '../dtos/register-device.dto';

@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) {}

    @Post()
    register(@Body() payload: RegisterDeviceDto) {
        return this.devicesService.register(payload);
    }
}
