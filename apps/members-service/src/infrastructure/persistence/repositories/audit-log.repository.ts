import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import {
    type AuditLogDetailModel,
    type AuditLogItemModel,
    type AuditLogRepositoryPort,
    type FindAuditLogOptions,
    type PaginatedAuditResult,
} from '../../../application/ports/audit-log-repository.port';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuthUserEntity } from '../entities/auth-user.entity';

interface AuditRawRow {
    audit_id: string;
    audit_table_schema: string;
    audit_table_name: string;
    audit_operation: 'INSERT' | 'UPDATE' | 'DELETE';
    audit_row_id: string | null;
    audit_actor_id: string | null;
    audit_changed_at: Date;
    actor_email: string | null;
}

@Injectable()
export class AuditLogRepository implements AuditLogRepositoryPort {
    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly repository: Repository<AuditLogEntity>,
    ) {}

    private baseQuery(): SelectQueryBuilder<AuditLogEntity> {
        return this.repository
            .createQueryBuilder('audit')
            .leftJoin(AuthUserEntity, 'actor', 'actor.id = audit.actor_id')
            .select([
                'audit.id AS audit_id',
                'audit.table_schema AS audit_table_schema',
                'audit.table_name AS audit_table_name',
                'audit.operation AS audit_operation',
                'audit.row_id AS audit_row_id',
                'audit.actor_id AS audit_actor_id',
                'audit.changed_at AS audit_changed_at',
                'actor.email AS actor_email',
            ]);
    }

    private applyFilters(
        qb: SelectQueryBuilder<AuditLogEntity>,
        options: FindAuditLogOptions,
    ): void {
        if (options.schema) {
            qb.andWhere('audit.table_schema = :schema', { schema: options.schema });
        }
        if (options.table) {
            qb.andWhere('audit.table_name = :table', { table: options.table });
        }
        if (options.operation) {
            qb.andWhere('audit.operation = :operation', {
                operation: options.operation,
            });
        }
        if (options.actorId) {
            qb.andWhere('audit.actor_id = :actorId', { actorId: options.actorId });
        }
        if (options.rowId) {
            qb.andWhere('audit.row_id = :rowId', { rowId: options.rowId });
        }
        if (options.dateFrom) {
            qb.andWhere('audit.changed_at >= :dateFrom', {
                dateFrom: options.dateFrom,
            });
        }
        if (options.dateTo) {
            qb.andWhere('audit.changed_at <= :dateTo', { dateTo: options.dateTo });
        }
    }

    private mapRowToItem(row: AuditRawRow): AuditLogItemModel {
        return {
            id: String(row.audit_id),
            tableSchema: row.audit_table_schema,
            tableName: row.audit_table_name,
            operation: row.audit_operation,
            rowId: row.audit_row_id,
            actorId: row.audit_actor_id,
            actorEmail: row.actor_email,
            changedAt: row.audit_changed_at,
        };
    }

    async findPaginated(
        options: FindAuditLogOptions,
    ): Promise<PaginatedAuditResult> {
        const page = Math.max(1, options.page ?? 1);
        const limit = Math.min(100, Math.max(1, options.limit ?? 20));
        const skip = (page - 1) * limit;

        const dataQb = this.baseQuery();
        this.applyFilters(dataQb, options);
        dataQb.orderBy('audit.changed_at', 'DESC').offset(skip).limit(limit);

        const countQb = this.repository.createQueryBuilder('audit');
        this.applyFilters(countQb, options);

        const [rows, total] = await Promise.all([
            dataQb.getRawMany<AuditRawRow>(),
            countQb.getCount(),
        ]);

        return {
            data: rows.map((row) => this.mapRowToItem(row)),
            total,
            page,
            limit,
        };
    }

    async findById(id: string): Promise<AuditLogDetailModel | null> {
        const qb = this.baseQuery().addSelect([
            'audit.old_data AS audit_old_data',
            'audit.new_data AS audit_new_data',
        ]);
        qb.where('audit.id = :id', { id });

        const row = await qb.getRawOne<
            AuditRawRow & {
                audit_old_data: Record<string, unknown> | null;
                audit_new_data: Record<string, unknown> | null;
            }
        >();
        if (!row) return null;

        return {
            ...this.mapRowToItem(row),
            oldData: row.audit_old_data,
            newData: row.audit_new_data,
        };
    }
}
