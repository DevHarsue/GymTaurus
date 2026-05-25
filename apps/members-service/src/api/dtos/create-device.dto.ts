import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeviceDto {
    @ApiProperty({ example: 'esp32-recepcion' })
    @IsString()
    @MinLength(2)
    deviceCode!: string;

    @ApiProperty({ example: 'Lector Recepcion' })
    @IsString()
    @MinLength(2)
    name!: string;

    @ApiPropertyOptional({ example: 'Entrada principal' })
    @IsOptional()
    @IsString()
    location?: string;
}
