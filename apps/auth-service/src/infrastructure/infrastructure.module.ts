import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { UsersRepository } from './repositories/users.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            RefreshTokenEntity,
            PasswordResetTokenEntity,
        ]),
    ],
    providers: [
        UsersRepository,
        RefreshTokensRepository,
        PasswordResetTokensRepository,
        { provide: 'UserRepositoryPort', useExisting: UsersRepository },
        {
            provide: 'RefreshTokenRepositoryPort',
            useExisting: RefreshTokensRepository,
        },
        {
            provide: 'PasswordResetTokenRepositoryPort',
            useExisting: PasswordResetTokensRepository,
        },
    ],
    exports: [
        'UserRepositoryPort',
        'RefreshTokenRepositoryPort',
        'PasswordResetTokenRepositoryPort',
    ],
})
export class InfrastructureModule {}
