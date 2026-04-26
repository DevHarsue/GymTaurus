import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    type CreateMemberData,
    type FindAllMembersOptions,
    type MemberModel,
    type MemberWithStatus,
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
            createdBy: entity.createdBy,
            name: entity.name,
            cedula: entity.cedula,
            phone: entity.phone,
            email: entity.email,
            fingerprintId: entity.fingerprintId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    async create(payload: CreateMemberData): Promise<MemberModel> {
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

    async findUsedFingerprintIds(): Promise<number[]> {
        const rows = await this.repository
            .createQueryBuilder('member')
            .select('member.fingerprintId', 'fingerprintId')
            .where('member.fingerprintId IS NOT NULL')
            .getRawMany<{ fingerprintId: number | string }>();
        return rows
            .map((row) => Number(row.fingerprintId))
            .filter((value) => Number.isInteger(value));
    }

    async setFingerprintId(
        memberId: string,
        fingerprintId: number | null,
    ): Promise<MemberModel | null> {
        if (fingerprintId === null) {
            await this.repository
                .createQueryBuilder()
                .update(MemberEntity)
                .set({ fingerprintId: () => 'NULL' })
                .where('id = :id', { id: memberId })
                .execute();
        } else {
            await this.repository.update(memberId, { fingerprintId });
        }
        return this.findById(memberId);
    }

    async findAll(
        options: FindAllMembersOptions,
    ): Promise<PaginatedResult<MemberWithStatus>> {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.repository
            .createQueryBuilder('member')
            .leftJoinAndSelect(
                'member.subscriptions',
                'sub',
                'sub.status = :active',
                { active: 'active' },
            );

        if (options.search) {
            queryBuilder.andWhere(
                'member.name ILIKE :search OR member.cedula ILIKE :search',
                { search: `%${options.search}%` },
            );
        }

        if (options.status === 'active') {
            queryBuilder.andWhere('sub.id IS NOT NULL');
        } else if (options.status === 'expired') {
            queryBuilder.andWhere('sub.id IS NULL');
        }

        const [entities, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy('member.createdAt', 'DESC')
            .getManyAndCount();

        return {
            data: entities.map((e) => this.toModelWithStatus(e)),
            total,
            page,
            limit,
        };
    }

    private toModelWithStatus(entity: MemberEntity): MemberWithStatus {
        const activeSub = entity.subscriptions?.find(
            (s) => s.status === 'active' && new Date(s.expiresAt) > new Date(),
        );

        let subscriptionStatus: 'active' | 'expired' | 'none' = 'none';
        let daysLeft = 0;

        if (activeSub) {
            subscriptionStatus = 'active';
            daysLeft = Math.ceil(
                (new Date(activeSub.expiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
            );
        } else if (entity.subscriptions?.length > 0) {
            subscriptionStatus = 'expired';
        }

        return {
            ...this.toModel(entity),
            subscriptionStatus,
            daysLeft,
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
