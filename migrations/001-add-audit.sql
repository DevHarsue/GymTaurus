-- ============================================================
-- MIGRACIÓN 001 — Auditoría a nivel de DB (triggers)
-- Crea schema audit, tabla audit_log, función log_changes
-- y triggers AFTER INSERT/UPDATE/DELETE en las 7 tablas PG.
--
-- Idempotente: puede aplicarse a una DB existente sin perder datos.
--
-- Aplicación manual:
--   docker compose exec -T postgres psql -U taurus -d taurus < migrations/001-add-audit.sql
-- ============================================================

-- Schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Tabla central de auditoría
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id            BIGSERIAL PRIMARY KEY,
    table_schema  TEXT        NOT NULL,
    table_name    TEXT        NOT NULL,
    operation     VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
    row_id        TEXT,
    actor_id      UUID,
    old_data      JSONB,
    new_data      JSONB,
    changed_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table   ON audit.audit_log(table_schema, table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor   ON audit.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed ON audit.audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_row_id  ON audit.audit_log(row_id);

-- Función genérica de trigger
-- Lee actor desde la variable de sesión app.current_user_id (puebla NestJS).
-- Redacta campos sensibles (password_hash, token) antes de persistir.
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor     UUID;
    v_row_id    TEXT;
    v_old       JSONB;
    v_new       JSONB;
    v_sensitive TEXT[] := ARRAY['password_hash', 'token'];
    v_field     TEXT;
BEGIN
    BEGIN
        v_actor := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN others THEN
        v_actor := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_row_id := v_old->>'id';
        FOREACH v_field IN ARRAY v_sensitive LOOP
            v_old := v_old - v_field;
        END LOOP;
        INSERT INTO audit.audit_log(table_schema, table_name, operation, row_id, actor_id, old_data, new_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'DELETE', v_row_id, v_actor, v_old, NULL);
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_row_id := v_new->>'id';
        FOREACH v_field IN ARRAY v_sensitive LOOP
            v_old := v_old - v_field;
            v_new := v_new - v_field;
        END LOOP;
        IF v_old IS DISTINCT FROM v_new THEN
            INSERT INTO audit.audit_log(table_schema, table_name, operation, row_id, actor_id, old_data, new_data)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'UPDATE', v_row_id, v_actor, v_old, v_new);
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
        v_row_id := v_new->>'id';
        FOREACH v_field IN ARRAY v_sensitive LOOP
            v_new := v_new - v_field;
        END LOOP;
        INSERT INTO audit.audit_log(table_schema, table_name, operation, row_id, actor_id, old_data, new_data)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'INSERT', v_row_id, v_actor, NULL, v_new);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers (DROP + CREATE para garantizar idempotencia ante re-runs)

-- auth schema
DROP TRIGGER IF EXISTS trg_audit_users          ON auth.users;
CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_refresh_tokens ON auth.refresh_tokens;
CREATE TRIGGER trg_audit_refresh_tokens
    AFTER INSERT OR UPDATE OR DELETE ON auth.refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- members schema
DROP TRIGGER IF EXISTS trg_audit_members            ON members.members;
CREATE TRIGGER trg_audit_members
    AFTER INSERT OR UPDATE OR DELETE ON members.members
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_membership_plans   ON members.membership_plans;
CREATE TRIGGER trg_audit_membership_plans
    AFTER INSERT OR UPDATE OR DELETE ON members.membership_plans
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_subscriptions      ON members.subscriptions;
CREATE TRIGGER trg_audit_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON members.subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_renewals           ON members.renewals;
CREATE TRIGGER trg_audit_renewals
    AFTER INSERT OR UPDATE OR DELETE ON members.renewals
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_devices            ON members.devices;
CREATE TRIGGER trg_audit_devices
    AFTER INSERT OR UPDATE OR DELETE ON members.devices
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
