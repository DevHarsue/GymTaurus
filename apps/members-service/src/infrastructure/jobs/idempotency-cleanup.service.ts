import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { IdempotencyRepositoryPort } from '../../application/ports/idempotency-repository.port';

const RETENTION_DAYS = 7;

/** Limpia claves de idempotencia antiguas (corre a las 3:00 AM). */
@Injectable()
export class IdempotencyCleanupService {
    private readonly logger = new Logger(IdempotencyCleanupService.name);

    constructor(
        @Inject('IdempotencyRepositoryPort')
        private readonly idempotencyRepository: IdempotencyRepositoryPort,
    ) {}

    @Cron('0 3 * * *')
    async cleanup(): Promise<void> {
        const cutoff = new Date(
            Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
        );
        const deleted =
            await this.idempotencyRepository.deleteOlderThan(cutoff);
        if (deleted > 0) {
            this.logger.log(
                `Eliminadas ${deleted} claves de idempotencia con mas de ${RETENTION_DAYS} dias`,
            );
        }
    }
}
