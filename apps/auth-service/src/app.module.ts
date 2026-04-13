import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '@libs/common';
import { ApiModule } from './api/api.module';
import { ApplicationModule } from './application/application.module';
import { RefreshTokenEntity } from './infrastructure/entities/refresh-token.entity';
import { UserEntity } from './infrastructure/entities/user.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('AUTH_DB_HOST', 'localhost'),
                port: configService.get<number>('AUTH_DB_PORT', 5432),
                username: configService.get<string>('AUTH_DB_USER', 'taurus'),
                password: configService.get<string>(
                    'AUTH_DB_PASSWORD',
                    'taurus',
                ),
                database: configService.get<string>('AUTH_DB_NAME', 'taurus'),
                schema: 'auth',
                entities: [UserEntity, RefreshTokenEntity],
                synchronize: false,
            }),
        }),
        ApplicationModule,
        ApiModule,
    ],
    providers: [JwtStrategy],
})
export class AppModule {}
