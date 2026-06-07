export interface IdempotencyRecord {
    key: string;
    endpoint: string;
    userId: string | null;
    /** 0 = reserva en curso; >0 = status HTTP de la respuesta cacheada. */
    responseStatus: number;
    responseBody: unknown | null;
    createdAt: Date;
}

export interface IdempotencyRepositoryPort {
    findByKey(key: string): Promise<IdempotencyRecord | null>;

    /**
     * Reserva la clave de forma atomica (INSERT con response_status = 0).
     * Devuelve false si la clave ya existe (request concurrente o replay).
     */
    tryInsertReservation(
        key: string,
        endpoint: string,
        userId: string | null,
    ): Promise<boolean>;

    /** Completa la reserva con la respuesta final. */
    saveResponse(key: string, status: number, body: unknown): Promise<void>;

    /** Libera la reserva (la operacion fallo; no cachear errores). */
    deleteKey(key: string): Promise<void>;

    /** Limpieza de claves antiguas. Devuelve filas eliminadas. */
    deleteOlderThan(date: Date): Promise<number>;
}
