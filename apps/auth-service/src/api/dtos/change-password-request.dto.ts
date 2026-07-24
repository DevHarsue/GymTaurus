import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { IsTaurusPassword } from '@libs/common';

export class ChangePasswordRequestDto {
    // Opcional: los usuarios de Google que aun no tienen clave la establecen
    // sin enviar contrasena actual.
    @ApiProperty({ example: 'OldPassword123!', required: false })
    @IsOptional()
    @IsString()
    @MinLength(8)
    currentPassword?: string;

    @ApiProperty({ example: 'NewSecurePa$$1234' })
    @IsTaurusPassword()
    newPassword!: string;
}
