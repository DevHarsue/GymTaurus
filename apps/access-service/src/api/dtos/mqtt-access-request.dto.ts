import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class MqttAccessRequestDto {
    @IsInt()
    @Min(1)
    fingerprint_id!: number;

    @IsDateString()
    timestamp!: string;

    @IsString()
    device_id!: string;
}
