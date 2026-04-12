import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type CreateMemberDto } from '../../../api/dtos/create-member.dto';
import {
    type MemberModel,
    type MemberRepositoryPort,
} from '../../../application/ports/member-repository.port';
import { MemberEntity } from '../entities/member.entity';

@Injectable()
export class MemberRepository implements MemberRepositoryPort {
    constructor(
        @InjectRepository(MemberEntity)
        private readonly repository: Repository<MemberEntity>,
    ) {}

    async create(payload: CreateMemberDto): Promise<MemberModel> {
        const entity = this.repository.create(payload);
        const saved = await this.repository.save(entity);
        return {
            id: saved.id,
            userId: saved.userId,
            name: saved.name,
            cedula: saved.cedula,
            phone: saved.phone,
            email: saved.email,
            fingerprintId: saved.fingerprintId,
        };
    }

    async findById(id: string): Promise<MemberModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) {
            return null;
        }
        return {
            id: entity.id,
            userId: entity.userId,
            name: entity.name,
            cedula: entity.cedula,
            phone: entity.phone,
            email: entity.email,
            fingerprintId: entity.fingerprintId,
        };
    }
}
