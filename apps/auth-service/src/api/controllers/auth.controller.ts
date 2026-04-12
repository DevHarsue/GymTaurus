import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { RefreshTokenRequestDto } from '../dtos/refresh-token-request.dto';

@Controller('auth')
export class AuthController {
    @Get('health')
    health(): { service: string; status: string } {
        return { service: 'auth-service', status: 'ok' };
    }

    @Post('login')
    login(@Body() payload: LoginRequestDto): LoginResponseDto {
        void payload;
        return {
            accessToken: 'pending-implementation',
            refreshToken: 'pending-implementation',
            tokenType: 'Bearer',
            expiresIn: '15m',
        };
    }

    @Post('refresh')
    refresh(@Body() payload: RefreshTokenRequestDto): LoginResponseDto {
        void payload;
        return {
            accessToken: 'pending-implementation',
            refreshToken: 'pending-implementation',
            tokenType: 'Bearer',
            expiresIn: '15m',
        };
    }
}
