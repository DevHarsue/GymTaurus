import { IsString } from 'class-validator';
import { BaseDto } from '@libs/common';

export class LoginResponseDto extends BaseDto {
    @IsString()
    accessToken!: string;

    @IsString()
    refreshToken!: string;

    @IsString()
    tokenType!: string;

    @IsString()
    expiresIn!: string;
}
