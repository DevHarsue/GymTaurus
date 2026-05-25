import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';
import type {
    CreateDeviceData,
    DeviceModel,
    DeviceRepositoryPort,
} from '../../../application/ports/device-repository.port';

@Injectable()
export class DeviceRepository implements DeviceRepositoryPort {
    constructor(
        @InjectRepository(DeviceEntity)
        private readonly repository: Repository<DeviceEntity>,
    ) {}

    async findAll(): Promise<DeviceModel[]> {
        const devices = await this.repository.find({
            order: { createdAt: 'DESC' },
        });
        return devices.map(this.toModel);
    }

    async findById(id: string): Promise<DeviceModel | null> {
        const device = await this.repository.findOne({ where: { id } });
        return device ? this.toModel(device) : null;
    }

    async findByDeviceCode(deviceCode: string): Promise<DeviceModel | null> {
        const device = await this.repository.findOne({
            where: { deviceCode },
        });
        return device ? this.toModel(device) : null;
    }

    async create(data: CreateDeviceData): Promise<DeviceModel> {
        const entity = this.repository.create({
            deviceCode: data.deviceCode,
            name: data.name,
            location: data.location,
        });
        const saved = await this.repository.save(entity);
        return this.toModel(saved);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    private toModel(entity: DeviceEntity): DeviceModel {
        return {
            id: entity.id,
            deviceCode: entity.deviceCode,
            name: entity.name,
            location: entity.location,
            status: entity.status,
            lastSeenAt: entity.lastSeenAt,
            createdAt: entity.createdAt,
        };
    }
}
