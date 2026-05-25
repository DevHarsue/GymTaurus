export interface DeviceModel {
    id: string;
    deviceCode: string;
    name: string;
    location?: string;
    status: string;
    lastSeenAt?: Date;
    createdAt: Date;
}

export interface CreateDeviceData {
    deviceCode: string;
    name: string;
    location?: string;
}

export interface DeviceRepositoryPort {
    findAll(): Promise<DeviceModel[]>;
    findById(id: string): Promise<DeviceModel | null>;
    findByDeviceCode(deviceCode: string): Promise<DeviceModel | null>;
    create(data: CreateDeviceData): Promise<DeviceModel>;
    delete(id: string): Promise<boolean>;
}
