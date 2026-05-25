import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '@libs/common';
import { DevicesService } from '../../application/services/devices.service';
import { CreateDeviceDto } from '../dtos/create-device.dto';

@ApiTags('Dispositivos')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) {}

    @Get()
    @ApiOperation({ summary: 'Listar todos los dispositivos registrados' })
    @ApiResponse({ status: 200, description: 'Lista de dispositivos' })
    findAll() {
        return this.devicesService.listDevices();
    }

    @Post()
    @ApiOperation({ summary: 'Registrar un nuevo dispositivo' })
    @ApiResponse({ status: 201, description: 'Dispositivo registrado' })
    @ApiConflictResponse({ description: 'Ya existe un dispositivo con ese codigo' })
    create(@Body() payload: CreateDeviceDto) {
        return this.devicesService.createDevice(payload);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un dispositivo' })
    @ApiParam({ name: 'id', description: 'UUID del dispositivo' })
    @ApiNotFoundResponse({ description: 'Dispositivo no encontrado' })
    @ApiResponse({ status: 200, description: 'Dispositivo eliminado' })
    remove(@Param('id') id: string) {
        return this.devicesService.deleteDevice(id);
    }
}
