import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthService } from './services/auth.service';

@Module({
    imports: [
        InfrastructureModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET', 'change-me'),
                signOptions: {
                    expiresIn: configService.get<string>(
                        'JWT_EXPIRES_IN',
                        '15m',
                    ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
                },
            }),
        }),
    ],
    providers: [AuthService],
    exports: [AuthService],
})
export class ApplicationModule {}
