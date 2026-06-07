import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
    type IdempotencyRecord,
    type IdempotencyRepositoryPort,
} from '../../../application/ports/idempotency-repository.port';
import { IdempotencyKeyEntity } from '../entities/idempotency-key.entity';

/** Codigo Postgres de violacion de unique constraint. */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class IdempotencyRepository implements IdempotencyRepositoryPort {
    constructor(
        @InjectRepository(IdempotencyKeyEntity)
        private readonly repository: Repository<IdempotencyKeyEntity>,
    ) {}

    private toModel(entity: IdempotencyKeyEntity): IdempotencyRecord {
        return {
            key: entity.key,
            endpoint: entity.endpoint,
            userId: entity.userId,
            responseStatus: entity.responseStatus,
            responseBody: entity.responseBody,
            createdAt: entity.createdAt,
        };
    }

    async findByKey(key: string): Promise<IdempotencyRecord | null> {
        const entity = await this.repository.findOne({ where: { key } });
        if (!entity) return null;
        return this.toModel(entity);
    }

    async tryInsertReservation(
        key: string,
        endpoint: string,
        userId: string | null,
    ): Promise<boolean> {
        try {
            await this.repository.insert({
                key,
                endpoint,
                userId,
                responseStatus: 0,
                responseBody: null,
            });
            return true;
        } catch (error) {
            const driverCode = (error as { driverError?: { code?: string } })
                ?.driverError?.code;
            if (driverCode === PG_UNIQUE_VIOLATION) return false;
            throw error;
        }
    }

    async saveResponse(
        key: string,
        status: number,
        body: unknown,
    ): Promise<void> {
        await this.repository.update(key, {
            responseStatus: status,
            responseBody: (body as object | null) ?? null,
        });
    }

    async deleteKey(key: string): Promise<void> {
        await this.repository.delete(key);
    }

    async deleteOlderThan(date: Date): Promise<number> {
        const result = await this.repository.delete({
            createdAt: LessThan(date),
        });
        return result.affected ?? 0;
    }
}
