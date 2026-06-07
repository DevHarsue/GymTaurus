-- ============================================================
-- 002 - Idempotencia para escrituras del cliente offline-first
--
-- Tabla de claves de idempotencia: cada operacion del outbox
-- movil envia un header `Idempotency-Key` (UUID). La primera
-- ejecucion reserva la clave y guarda la respuesta; los replays
-- devuelven la respuesta cacheada sin re-ejecutar la operacion.
--
-- NOTA: en entornos ya inicializados, aplicar a mano:
--   docker exec -i taurus-postgres psql -U taurus -d taurus < migrations/002-add-idempotency.sql
-- (init.sql solo corre en el primer arranque del contenedor)
-- ============================================================

CREATE TABLE IF NOT EXISTS members.idempotency_keys (
    key             UUID         PRIMARY KEY,
    endpoint        VARCHAR(120) NOT NULL,
    user_id         UUID,
    response_status INT          NOT NULL,
    response_body   JSONB,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created
    ON members.idempotency_keys (created_at);

-- Sin trigger de auditoria: esta tabla es metadata de transporte,
-- no datos de negocio.
