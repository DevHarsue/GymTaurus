import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IsTaurusEmail, IsTaurusPassword, Role } from '@libs/common';

export class RegisterRequestDto {
    @ApiProperty({ example: 'user@taurus.gym' })
    @IsTaurusEmail()
    email!: string;

    @ApiProperty({ example: 'SecurePa$$1234', minLength: 8 })
    @IsTaurusPassword()
    password!: string;

    @ApiPropertyOptional({ enum: Role, example: Role.MEMBER })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
