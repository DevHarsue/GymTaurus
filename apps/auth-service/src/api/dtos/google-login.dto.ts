import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
    @ApiPropertyOptional({ description: 'El ID Token JWT retornado por Google', example: 'eyJhbGciOiJSUzI1NiIs...' })
    @IsOptional()
    @IsString()
    idToken?: string;

    @ApiPropertyOptional({ description: 'El Access Token retornado por Google (usado en flujo implícito web)', example: 'ya29.a0AfH6SMA...' })
    @IsOptional()
    @IsString()
    accessToken?: string;
}
