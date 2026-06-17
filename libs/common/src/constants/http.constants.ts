// Constantes HTTP transversales a todos los microservicios.
// Solo se centraliza aqui lo que es contrato compartido entre servicios
// (headers estandar, codigos abstractos de respuesta). Los mensajes de
// error de cada dominio viven en su propio microservicio.

export const HTTP_HEADERS = {
    IDEMPOTENCY_KEY: 'Idempotency-Key',
} as const;

// Codigos abstractos de error a nivel de transporte. Identifican el TIPO de
// fallo de forma agnostica al dominio, para que cualquier servicio pueda
// incluirlos en el body de la respuesta sin acoplarse a mensajes concretos.
export const HTTP_ERROR_CODES = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
