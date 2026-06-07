import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditContextModule, JwtStrategy } from '@libs/common';
import { ApiModule } from './api/api.module';
import { ApplicationModule } from './application/application.module';
import { AuditLogEntity } from './infrastructure/persistence/entities/audit-log.entity';
import { AuthUserEntity } from './infrastructure/persistence/entities/auth-user.entity';
import { DeviceEntity } from './infrastructure/persistence/entities/device.entity';
import { IdempotencyKeyEntity } from './infrastructure/persistence/entities/idempotency-key.entity';
import { MemberEntity } from './infrastructure/persistence/entities/member.entity';
import { MembershipPlanEntity } from './infrastructure/persistence/entities/membership-plan.entity';
import { RenewalEntity } from './infrastructure/persistence/entities/renewal.entity';
import { SubscriptionEntity } from './infrastructure/persistence/entities/subscription.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ScheduleModule.forRoot(),
        AuditContextModule,
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
                    AuditLogEntity,
                    AuthUserEntity,
                    IdempotencyKeyEntity,
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
    providers: [JwtStrategy],
})
export class AppModule {}
