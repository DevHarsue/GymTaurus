import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository {
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
}
