import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import type {
    CreateDeviceData,
    DeviceModel,
    DeviceRepositoryPort,
} from '../ports/device-repository.port';

@Injectable()
export class DevicesService {
    constructor(
        @Inject('DeviceRepositoryPort')
        private readonly deviceRepository: DeviceRepositoryPort,
    ) {}

    async listDevices(): Promise<DeviceModel[]> {
        return this.deviceRepository.findAll();
    }

    async createDevice(data: CreateDeviceData): Promise<DeviceModel> {
        const existing = await this.deviceRepository.findByDeviceCode(
            data.deviceCode,
        );
        if (existing) {
            throw new ConflictException(
                `Ya existe un dispositivo con el codigo ${data.deviceCode}`,
            );
        }
        return this.deviceRepository.create(data);
    }

    async deleteDevice(id: string): Promise<void> {
        const deleted = await this.deviceRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(
                `Dispositivo con ID ${id} no encontrado`,
            );
        }
    }
}
