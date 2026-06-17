import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '@libs/common';
import { DevicesService } from '../../application/services/devices.service';
import { RegisterDeviceDto } from '../dtos/register-device.dto';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) {}

    @Post()
    register(@Body() payload: RegisterDeviceDto) {
        return this.devicesService.register(payload);
    }
}
