import { IsBoolean, IsIn, IsInt, IsString, Min } from 'class-validator';
import { type AccessReason } from '../../application/ports/access-log-repository.port';

export class MqttAccessResponseDto {
    @IsInt()
    @Min(1)
    fingerprint_id!: number;

    @IsBoolean()
    granted!: boolean;

    @IsString()
    name!: string;

    @IsInt()
    @Min(0)
    days_left!: number;

    @IsIn(['active', 'expired', 'not_found'])
    reason!: AccessReason;
}
