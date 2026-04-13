import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { type RefreshTokenRepositoryPort } from '../../application/ports/refresh-token-repository.port';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository implements RefreshTokenRepositoryPort {
    constructor(
        @InjectRepository(RefreshTokenEntity)
        private readonly repository: Repository<RefreshTokenEntity>,
    ) {}

    async findByToken(token: string): Promise<RefreshTokenEntity | null> {
        return this.repository.findOne({ where: { token } });
    }

    async findByUserId(userId: string): Promise<RefreshTokenEntity[]> {
        return this.repository.find({ where: { userId } });
    }

    async create(data: {
        userId: string;
        token: string;
        expiresAt: Date;
    }): Promise<RefreshTokenEntity> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async deleteByToken(token: string): Promise<boolean> {
        const result = await this.repository.delete({ token });
        return (result.affected ?? 0) > 0;
    }

    async deleteExpiredByUserId(userId: string): Promise<void> {
        await this.repository.delete({
            userId,
            expiresAt: LessThan(new Date()),
        });
    }
}
