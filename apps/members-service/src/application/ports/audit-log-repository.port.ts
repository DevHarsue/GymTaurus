export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogItemModel {
    id: string;
    tableSchema: string;
    tableName: string;
    operation: AuditOperation;
    rowId?: string | null;
    actorId?: string | null;
    actorEmail?: string | null;
    changedAt: Date;
}

export interface AuditLogDetailModel extends AuditLogItemModel {
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
}

export interface FindAuditLogOptions {
    page?: number;
    limit?: number;
    schema?: string;
    table?: string;
    operation?: AuditOperation;
    actorId?: string;
    rowId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface PaginatedAuditResult {
    data: AuditLogItemModel[];
    total: number;
    page: number;
    limit: number;
}

export interface AuditLogRepositoryPort {
    findPaginated(options: FindAuditLogOptions): Promise<PaginatedAuditResult>;
    findById(id: string): Promise<AuditLogDetailModel | null>;
}
