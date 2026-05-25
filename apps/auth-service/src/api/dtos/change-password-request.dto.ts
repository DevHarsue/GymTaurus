import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { IsTaurusPassword } from '@libs/common';

export class ChangePasswordRequestDto {
    @ApiProperty({ example: 'OldPassword123!' })
    @IsString()
    @MinLength(8)
    currentPassword!: string;

    @ApiProperty({ example: 'NewSecurePa$$1234' })
    @IsTaurusPassword()
    newPassword!: string;
}
