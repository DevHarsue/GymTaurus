// Constantes HTTP transversales a todos los microservicios.
// Solo se centraliza aqui lo que es contrato compartido entre servicios
// (headers estandar, codigos abstractos de respuesta). Los mensajes de
// error de cada dominio viven en su propio microservicio.

export const HTTP_HEADERS = {
    IDEMPOTENCY_KEY: 'Idempotency-Key',
} as const;
