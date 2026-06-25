import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// Header estandar de tracing entre servicios.
export const REQUEST_ID_HEADER = 'x-request-id';

// Middleware que asegura que cada request tenga un X-Request-Id:
// - si el cliente lo manda, lo reutiliza
// - si no, genera uno con randomUUID
// El id se deja accesible en req.headers y se devuelve en la respuesta
// para que el cliente (o un proxy aguas arriba) lo pueda correlacionar.
export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId =
        incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();

    req.headers[REQUEST_ID_HEADER] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
}
