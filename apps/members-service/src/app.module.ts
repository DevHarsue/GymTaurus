import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from './api/api.module';
import { ApplicationModule } from './application/application.module';
import { DeviceEntity } from './infrastructure/persistence/entities/device.entity';
import { MemberEntity } from './infrastructure/persistence/entities/member.entity';
import { MembershipPlanEntity } from './infrastructure/persistence/entities/membership-plan.entity';
import { RenewalEntity } from './infrastructure/persistence/entities/renewal.entity';
import { SubscriptionEntity } from './infrastructure/persistence/entities/subscription.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('MEMBERS_DB_HOST', 'localhost'),
                port: configService.get<number>('MEMBERS_DB_PORT', 5432),
                username: configService.get<string>(
                    'MEMBERS_DB_USER',
                    'taurus',
                ),
                password: configService.get<string>(
                    'MEMBERS_DB_PASSWORD',
                    'taurus',
                ),
                database: configService.get<string>(
                    'MEMBERS_DB_NAME',
                    'taurus',
                ),
                schema: 'members',
                entities: [
                    MemberEntity,
                    MembershipPlanEntity,
                    SubscriptionEntity,
                    RenewalEntity,
                    DeviceEntity,
                ],
                synchronize: false,
            }),
        }),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                },
            }),
        }),
        ApplicationModule,
        ApiModule,
    ],
})
export class AppModule {}
