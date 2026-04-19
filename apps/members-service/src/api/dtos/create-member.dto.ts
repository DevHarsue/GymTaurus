import {
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
    @ApiProperty({ example: 'Juan Pérez' })
    @IsString()
    @MinLength(2)
    name!: string;

    @ApiProperty({ example: 'V-12345678' })
    @IsString()
    cedula!: string;

    @ApiProperty({ example: 'juan@correo.com' })
    @IsEmail()
    email!: string;

    @ApiPropertyOptional({ example: 'SecurePass123', minLength: 8 })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiPropertyOptional({ example: '0412-1234567' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    fingerprintId?: number;
}
