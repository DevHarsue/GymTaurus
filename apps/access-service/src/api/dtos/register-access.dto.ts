import {
    IsBoolean,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class RegisterAccessDto {
    @IsUUID()
    memberId!: string;

    @IsInt()
    fingerprintId!: number;

    @IsString()
    memberName!: string;

    @IsBoolean()
    granted!: boolean;

    @IsString()
    reason!: string;

    @IsString()
    deviceId!: string;

    @IsOptional()
    @IsDateString()
    timestamp?: string;
}
