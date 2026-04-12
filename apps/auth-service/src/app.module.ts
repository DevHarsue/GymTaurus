import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './api/controllers/auth.controller';
import { RefreshTokenEntity } from './infrastructure/entities/refresh-token.entity';
import { UserEntity } from './infrastructure/entities/user.entity';
import { RefreshTokensRepository } from './infrastructure/repositories/refresh-tokens.repository';
import { UsersRepository } from './infrastructure/repositories/users.repository';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
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
        TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    ],
    controllers: [AuthController],
    providers: [UsersRepository, RefreshTokensRepository],
})
export class AppModule {}
