import { IsInt, IsString, Min } from 'class-validator';

export class DeviceHeartbeatDto {
    @IsString()
    device_id!: string;

    @IsInt()
    @Min(0)
    uptime!: number;
}
