import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UsersRepository } from './repositories/users.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity])],
    providers: [
        UsersRepository,
        RefreshTokensRepository,
        { provide: 'UserRepositoryPort', useExisting: UsersRepository },
        {
            provide: 'RefreshTokenRepositoryPort',
            useExisting: RefreshTokensRepository,
        },
    ],
    exports: ['UserRepositoryPort', 'RefreshTokenRepositoryPort'],
})
export class InfrastructureModule {}
