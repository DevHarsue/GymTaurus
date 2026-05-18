import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Role } from '@libs/common';
import { type UserRepositoryPort } from '../../application/ports/user-repository.port';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersRepository implements UserRepositoryPort {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
    ) {}

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { email } });
    }

    async findByGoogleId(googleId: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { googleId } });
    }

    async findById(id: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { id } });
    }

    async create(data: {
        email: string;
        googleId?: string;
        passwordHash: string;
        role: Role;
    }): Promise<UserEntity> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
        await this.repository.update(id, data);
        const entity = await this.findById(id);
        if (!entity) throw new Error('User not found after update');
        return entity;
    }
}
