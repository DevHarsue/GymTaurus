import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@libs/common';

export class RegisterRequestDto {
    @ApiProperty({ example: 'user@taurus.gym' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'SecurePass1', minLength: 8 })
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiProperty({ enum: Role, example: Role.MEMBER })
    @IsEnum(Role)
    role!: Role;
}
