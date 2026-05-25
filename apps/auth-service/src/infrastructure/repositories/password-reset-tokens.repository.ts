import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type PasswordResetTokenRepositoryPort } from '../../application/ports/password-reset-token-repository.port';
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokensRepository
    implements PasswordResetTokenRepositoryPort
{
    constructor(
        @InjectRepository(PasswordResetTokenEntity)
        private readonly repository: Repository<PasswordResetTokenEntity>,
    ) {}

    async findByToken(
        token: string,
    ): Promise<PasswordResetTokenEntity | null> {
        return this.repository.findOne({ where: { token } });
    }

    async create(data: {
        userId: string;
        token: string;
        expiresAt: Date;
    }): Promise<PasswordResetTokenEntity> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async deleteByToken(token: string): Promise<boolean> {
        const result = await this.repository.delete({ token });
        return (result.affected ?? 0) > 0;
    }

    async deleteByUserId(userId: string): Promise<void> {
        await this.repository.delete({ userId });
    }
}
