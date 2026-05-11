import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsTaurusCedula,
    IsTaurusEmail,
    IsTaurusPassword,
    IsTaurusPhone,
} from '@libs/common';

export class CreateMemberDto {
    @ApiProperty({ example: 'Juan Pérez' })
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    name!: string;

    @ApiProperty({ example: '12345678' })
    @IsTaurusCedula()
    cedula!: string;

    @ApiProperty({ example: 'juan@correo.com' })
    @IsTaurusEmail()
    email!: string;

    @ApiPropertyOptional({ example: 'SecurePa$$1234', minLength: 8 })
    @IsOptional()
    @IsTaurusPassword()
    password?: string;

    @ApiPropertyOptional({ example: '584141771490' })
    @IsOptional()
    @IsTaurusPhone()
    phone?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    fingerprintId?: number;
}
