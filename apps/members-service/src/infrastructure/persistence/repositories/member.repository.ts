import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { type CreateMemberDto } from '../../../api/dtos/create-member.dto';
import {
    type FindAllMembersOptions,
    type MemberModel,
    type MemberRepositoryPort,
    type PaginatedResult,
} from '../../../application/ports/member-repository.port';
import { MemberEntity } from '../entities/member.entity';

@Injectable()
export class MemberRepository implements MemberRepositoryPort {
    constructor(
        @InjectRepository(MemberEntity)
        private readonly repository: Repository<MemberEntity>,
    ) {}

    private toModel(entity: MemberEntity): MemberModel {
        return {
            id: entity.id,
            userId: entity.userId,
            name: entity.name,
            cedula: entity.cedula,
            phone: entity.phone,
            email: entity.email,
            fingerprintId: entity.fingerprintId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    async create(payload: CreateMemberDto): Promise<MemberModel> {
        const entity = this.repository.create(payload);
        const saved = await this.repository.save(entity);
        return this.toModel(saved);
    }

    async findById(id: string): Promise<MemberModel | null> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async findByCedula(cedula: string): Promise<MemberModel | null> {
        const entity = await this.repository.findOne({ where: { cedula } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async findByFingerprintId(fingerprintId: number): Promise<MemberModel | null> {
        const entity = await this.repository.findOne({ where: { fingerprintId } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async findAll(
        options: FindAllMembersOptions,
    ): Promise<PaginatedResult<MemberModel>> {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.repository.createQueryBuilder('member');

        if (options.search) {
            queryBuilder.andWhere('member.name ILIKE :search OR member.cedula ILIKE :search', { search: `%${options.search}%` });
        }

        if (options.status) {
            queryBuilder
                .leftJoin('member.subscriptions', 'sub')
                .andWhere('sub.status = :status', { status: options.status });
        }

        const [entities, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('member.createdAt', 'DESC')
            .getManyAndCount();

        return {
            data: entities.map((e) => this.toModel(e)),
            total,
            page,
            limit,
        };
    }

    async update(
        id: string,
        payload: Partial<Pick<MemberModel, 'name' | 'phone' | 'email'>>,
    ): Promise<MemberModel | null> {
        await this.repository.update(id, payload);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
