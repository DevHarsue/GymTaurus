import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsTaurusPassword } from '@libs/common';

export class ResetPasswordRequestDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    @IsString()
    @IsNotEmpty()
    token!: string;

    @ApiProperty({ example: 'NewSecurePa$$1234' })
    @IsTaurusPassword()
    newPassword!: string;
}
