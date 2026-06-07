import {
    BadRequestException,
    CallHandler,
    ConflictException,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { from, Observable, of } from 'rxjs';
import { catchError, mergeMap, map } from 'rxjs/operators';
import type { IdempotencyRepositoryPort } from '../../application/ports/idempotency-repository.port';

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AuthenticatedRequest extends Request {
    user?: { sub?: string };
}

/**
 * Idempotencia para escrituras del cliente offline-first.
 *
 * - Sin header `Idempotency-Key`: no hace nada (no intrusivo).
 * - Primera vez: reserva la clave de forma atomica, ejecuta el handler y
 *   guarda la respuesta. Si el handler falla, libera la reserva (los errores
 *   no se cachean: el cliente puede reintentar).
 * - Replay: devuelve la respuesta cacheada sin re-ejecutar la operacion
 *   (no duplica suscripciones, jobs ni entradas de auditoria).
 * - Request concurrente con la misma clave (reserva en curso): 409; el
 *   outbox del cliente reintenta y entonces recibe la respuesta cacheada.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(
        @Inject('IdempotencyRepositoryPort')
        private readonly idempotencyRepository: IdempotencyRepositoryPort,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const res = context.switchToHttp().getResponse<Response>();

        const rawKey = req.header('Idempotency-Key');
        if (!rawKey) {
            return next.handle();
        }

        const key = rawKey.trim().toLowerCase();
        if (!UUID_RE.test(key)) {
            throw new BadRequestException(
                'Idempotency-Key invalida: debe ser un UUID',
            );
        }

        const route = req.route as { path?: string } | undefined;
        const endpoint = `${req.method} ${route?.path ?? req.path}`.slice(
            0,
            120,
        );

        const existing = await this.idempotencyRepository.findByKey(key);
        if (existing) {
            if (existing.responseStatus === 0) {
                // Reserva en curso: otra request con la misma clave esta en vuelo.
                throw new ConflictException(
                    'Operacion en proceso, reintente en unos segundos',
                );
            }
            if (existing.endpoint !== endpoint) {
                throw new ConflictException(
                    'Idempotency-Key ya utilizada en otra operacion',
                );
            }
            res.status(existing.responseStatus);
            return of(existing.responseBody);
        }

        const reserved = await this.idempotencyRepository.tryInsertReservation(
            key,
            endpoint,
            req.user?.sub ?? null,
        );
        if (!reserved) {
            // Carrera: otra request inserto la reserva entre el find y el insert.
            throw new ConflictException(
                'Operacion en proceso, reintente en unos segundos',
            );
        }

        // Status por defecto de Nest: 201 para POST, 200 para el resto
        // (ninguna de las rutas interceptadas usa @HttpCode custom).
        const successStatus = req.method === 'POST' ? 201 : 200;

        return next.handle().pipe(
            mergeMap((body) =>
                from(
                    this.idempotencyRepository.saveResponse(
                        key,
                        successStatus,
                        body ?? null,
                    ),
                ).pipe(map(() => body)),
            ),
            catchError((error: unknown) =>
                from(this.idempotencyRepository.deleteKey(key)).pipe(
                    mergeMap(() => {
                        throw error;
                    }),
                ),
            ),
        );
    }
}
