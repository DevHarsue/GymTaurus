import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDeviceDto {
    @IsString()
    @MinLength(2)
    deviceCode!: string;

    @IsString()
    @MinLength(2)
    name!: string;

    @IsOptional()
    @IsString()
    location?: string;
}
