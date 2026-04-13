-- ============================================================
-- TAURUS GYM — PostgreSQL Init Script
-- Ejecutar al primer arranque (Docker entrypoint o manual)
-- ============================================================

-- Crear schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS members;

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHEMA: auth (auth-service — Said)
-- ============================================================

CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'member')),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE auth.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);

-- ============================================================
-- SCHEMA: members (members-service — Chen)
-- ============================================================

CREATE TABLE members.membership_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    duration_days   INT          NOT NULL CHECK (duration_days > 0),
    reference_price DECIMAL(10,2) DEFAULT 0,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE members.members (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID         NOT NULL UNIQUE,
    name                    VARCHAR(255) NOT NULL,
    cedula                  VARCHAR(20)  NOT NULL UNIQUE,
    phone                   VARCHAR(20),
    email                   VARCHAR(255),
    fingerprint_id          INT          UNIQUE,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE members.subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID         NOT NULL REFERENCES members.members(id) ON DELETE CASCADE,
    plan_id         UUID         NOT NULL REFERENCES members.membership_plans(id),
    status          VARCHAR(20)  NOT NULL DEFAULT 'expired' CHECK (status IN ('active', 'expired', 'cancelled')),
    starts_at       TIMESTAMP    NOT NULL,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE members.renewals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID         NOT NULL REFERENCES members.subscriptions(id) ON DELETE CASCADE,
    plan_id         UUID         NOT NULL REFERENCES members.membership_plans(id),
    renewed_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    new_expires_at  TIMESTAMP    NOT NULL,
    renewed_by      UUID         NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE members.devices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_code     VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    location        VARCHAR(255),
    status          VARCHAR(20)  NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    last_seen_at    TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX idx_members_cedula         ON members.members(cedula);
CREATE INDEX idx_members_fingerprint    ON members.members(fingerprint_id);
CREATE INDEX idx_members_name           ON members.members(name);
CREATE INDEX idx_subscriptions_member   ON members.subscriptions(member_id);
CREATE INDEX idx_subscriptions_status   ON members.subscriptions(status);
CREATE INDEX idx_subscriptions_expires  ON members.subscriptions(expires_at);
CREATE INDEX idx_renewals_subscription  ON members.renewals(subscription_id);
CREATE INDEX idx_renewals_renewed_at    ON members.renewals(renewed_at);
CREATE INDEX idx_devices_code           ON members.devices(device_code);
CREATE INDEX idx_devices_status         ON members.devices(status);

-- ============================================================
-- DATOS SEMILLA (para empezar a trabajar sin crear todo manual)
-- ============================================================

-- Planes por defecto
INSERT INTO members.membership_plans (name, duration_days, reference_price, is_active) VALUES
    ('Mensual',     30,  20.00, TRUE),
    ('Trimestral',  90,  50.00, TRUE),
    ('Semestral',  180,  90.00, TRUE),
    ('Anual',      365, 150.00, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Dispositivo ESP32 de recepción
INSERT INTO members.devices (device_code, name, location, status) VALUES
    ('esp32-recepcion', 'Nodo recepción', 'Entrada principal', 'offline')
ON CONFLICT (device_code) DO NOTHING;

-- Admin seed user (password: Admin123!)
INSERT INTO auth.users (email, password_hash, role) VALUES
    ('admin@taurus.gym', '$2b$10$oKHOveyfZQsE13yINjUaZerY5kBigu0LawfqPgZUf9nGeWohxiInq', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Miembro seed user (password: Member123!)
INSERT INTO auth.users (email, password_hash, role) VALUES
    ('miembro1@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member')
ON CONFLICT (email) DO NOTHING;

-- Perfil seed de miembro con huella utilizable por access-service
INSERT INTO members.members (
    user_id,
    name,
    cedula,
    phone,
    email,
    fingerprint_id
)
SELECT
    u.id,
    'Miembro Seed',
    'V-10000001',
    '0412-0000001',
    'miembro1@taurus.gym',
    1
FROM auth.users u
WHERE u.email = 'miembro1@taurus.gym'
  AND NOT EXISTS (
      SELECT 1
      FROM members.members m
      WHERE m.cedula = 'V-10000001'
         OR m.fingerprint_id = 1
  );

-- Suscripción activa seed para pruebas end-to-end
INSERT INTO members.subscriptions (
    member_id,
    plan_id,
    status,
    starts_at,
    expires_at
)
SELECT
    m.id,
    p.id,
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '29 days'
FROM members.members m
JOIN members.membership_plans p ON p.name = 'Mensual'
WHERE m.fingerprint_id = 1
  AND NOT EXISTS (
      SELECT 1
      FROM members.subscriptions s
      WHERE s.member_id = m.id
        AND s.status = 'active'
        AND s.expires_at > NOW()
  );

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON members.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_refresh_tokens_updated_at
    BEFORE UPDATE ON auth.refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
