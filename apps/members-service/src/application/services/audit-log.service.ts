import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    type AuditLogDetailModel,
    type AuditLogRepositoryPort,
    type FindAuditLogOptions,
    type PaginatedAuditResult,
} from '../ports/audit-log-repository.port';

@Injectable()
export class AuditLogService {
    constructor(
        @Inject('AuditLogRepositoryPort')
        private readonly auditLogRepository: AuditLogRepositoryPort,
    ) {}

    listAuditLog(options: FindAuditLogOptions): Promise<PaginatedAuditResult> {
        return this.auditLogRepository.findPaginated(options);
    }

    async getAuditEntry(id: string): Promise<AuditLogDetailModel> {
        const entry = await this.auditLogRepository.findById(id);
        if (!entry) {
            throw new NotFoundException(
                `Entrada de auditoria con ID ${id} no encontrada`,
            );
        }
        return entry;
    }
}
