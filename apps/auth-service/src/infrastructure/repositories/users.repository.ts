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

    async findById(id: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { id } });
    }

    async create(data: {
        email: string;
        passwordHash: string;
        role: Role;
    }): Promise<UserEntity> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }
}
