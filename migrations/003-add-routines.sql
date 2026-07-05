-- ============================================================
-- 003 - Rutinas de ejercicio
--
-- Catalogo de ejercicios reutilizable + plantillas de rutina
-- (rutina -> dias -> ejercicios con prescripcion) + asignacion
-- por dia de la semana a cada miembro + diario de entrenamiento
-- (workout_logs / set_logs) para registrar pesos/reps reales.
--
-- Disenado para offline-first: el miembro descarga su "bundle"
-- (asignacion + rutina completa) una vez y la app calcula "lo de
-- hoy" en el cliente; los registros del miembro se sincronizan via
-- Idempotency-Key (members.idempotency_keys, ver 002).
--
-- NOTA: en entornos ya inicializados, aplicar a mano:
--   docker exec -i taurus-postgres psql -U taurus -d taurus < migrations/003-add-routines.sql
-- (init.sql solo corre en el primer arranque del contenedor)
-- ============================================================

-- ── Catalogo de ejercicios ─────────────────────────────────
CREATE TABLE IF NOT EXISTS members.exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    muscle_group    VARCHAR(60),
    equipment       VARCHAR(80),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by      UUID,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Plantilla de rutina ────────────────────────────────────
CREATE TABLE IF NOT EXISTS members.routines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    level           VARCHAR(20)  NOT NULL DEFAULT 'beginner'
                       CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    goal            VARCHAR(40),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by      UUID,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Dias de la rutina ("Dia A - Pecho", etc.) ──────────────
CREATE TABLE IF NOT EXISTS members.routine_days (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id      UUID         NOT NULL REFERENCES members.routines(id) ON DELETE CASCADE,
    label           VARCHAR(120) NOT NULL,
    order_index     INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Ejercicios de cada dia (prescripcion) ──────────────────
-- exercise_name es un snapshot: la app del miembro lo muestra aun
-- offline y sobrevive si el ejercicio del catalogo cambia/se borra.
CREATE TABLE IF NOT EXISTS members.routine_exercises (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_day_id  UUID         NOT NULL REFERENCES members.routine_days(id) ON DELETE CASCADE,
    exercise_id     UUID         REFERENCES members.exercises(id) ON DELETE SET NULL,
    exercise_name   VARCHAR(150) NOT NULL,
    order_index     INT          NOT NULL DEFAULT 0,
    sets            INT          NOT NULL DEFAULT 3 CHECK (sets > 0),
    reps            VARCHAR(40)  NOT NULL DEFAULT '10',
    weight          VARCHAR(40),
    rest_seconds    INT,
    rpe             VARCHAR(20),
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Asignacion de una rutina a un miembro por dia de semana ─
-- day_mapping: { "monday": "<routine_day_id>", "wednesday": ... }
-- Un miembro tiene como mucho UNA asignacion activa a la vez.
CREATE TABLE IF NOT EXISTS members.routine_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID         NOT NULL REFERENCES members.members(id) ON DELETE CASCADE,
    routine_id      UUID         NOT NULL REFERENCES members.routines(id) ON DELETE CASCADE,
    assigned_by     UUID,
    day_mapping     JSONB        NOT NULL DEFAULT '{}',
    starts_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    ends_at         TIMESTAMP,
    status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'paused', 'finished')),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Diario: sesion entrenada por el miembro ────────────────
CREATE TABLE IF NOT EXISTS members.workout_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID         NOT NULL REFERENCES members.members(id) ON DELETE CASCADE,
    assignment_id   UUID         REFERENCES members.routine_assignments(id) ON DELETE SET NULL,
    routine_day_id  UUID         REFERENCES members.routine_days(id) ON DELETE SET NULL,
    day_label       VARCHAR(120),
    performed_on    DATE         NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'completed'
                       CHECK (status IN ('completed', 'partial', 'skipped')),
    notes           TEXT,
    client_id       UUID,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Diario: series reales por ejercicio ────────────────────
CREATE TABLE IF NOT EXISTS members.set_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id      UUID         NOT NULL REFERENCES members.workout_logs(id) ON DELETE CASCADE,
    routine_exercise_id UUID         REFERENCES members.routine_exercises(id) ON DELETE SET NULL,
    exercise_name       VARCHAR(150) NOT NULL,
    set_number          INT          NOT NULL DEFAULT 1,
    reps_done           INT,
    weight_done         DECIMAL(7,2),
    done                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Indices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exercises_active            ON members.exercises(is_active);
CREATE INDEX IF NOT EXISTS idx_exercises_name              ON members.exercises(name);
CREATE INDEX IF NOT EXISTS idx_routines_active             ON members.routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_days_routine        ON members.routine_days(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_day       ON members.routine_exercises(routine_day_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise  ON members.routine_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_routine_assignments_member  ON members.routine_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_routine_assignments_routine ON members.routine_assignments(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_member         ON members.workout_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_performed      ON members.workout_logs(performed_on DESC);
CREATE INDEX IF NOT EXISTS idx_set_logs_log                ON members.set_logs(workout_log_id);

-- Maximo una asignacion activa por miembro (la app muestra "mi rutina").
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment_per_member
    ON members.routine_assignments(member_id)
    WHERE status = 'active';

-- ── Triggers: updated_at automatico ────────────────────────
DROP TRIGGER IF EXISTS trg_exercises_updated_at ON members.exercises;
CREATE TRIGGER trg_exercises_updated_at
    BEFORE UPDATE ON members.exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_routines_updated_at ON members.routines;
CREATE TRIGGER trg_routines_updated_at
    BEFORE UPDATE ON members.routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_routine_days_updated_at ON members.routine_days;
CREATE TRIGGER trg_routine_days_updated_at
    BEFORE UPDATE ON members.routine_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_routine_exercises_updated_at ON members.routine_exercises;
CREATE TRIGGER trg_routine_exercises_updated_at
    BEFORE UPDATE ON members.routine_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_routine_assignments_updated_at ON members.routine_assignments;
CREATE TRIGGER trg_routine_assignments_updated_at
    BEFORE UPDATE ON members.routine_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_workout_logs_updated_at ON members.workout_logs;
CREATE TRIGGER trg_workout_logs_updated_at
    BEFORE UPDATE ON members.workout_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Triggers: auditoria (reusa audit.log_changes de init.sql/001) ──
DROP TRIGGER IF EXISTS trg_audit_exercises ON members.exercises;
CREATE TRIGGER trg_audit_exercises
    AFTER INSERT OR UPDATE OR DELETE ON members.exercises
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_routines ON members.routines;
CREATE TRIGGER trg_audit_routines
    AFTER INSERT OR UPDATE OR DELETE ON members.routines
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_routine_days ON members.routine_days;
CREATE TRIGGER trg_audit_routine_days
    AFTER INSERT OR UPDATE OR DELETE ON members.routine_days
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_routine_exercises ON members.routine_exercises;
CREATE TRIGGER trg_audit_routine_exercises
    AFTER INSERT OR UPDATE OR DELETE ON members.routine_exercises
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_routine_assignments ON members.routine_assignments;
CREATE TRIGGER trg_audit_routine_assignments
    AFTER INSERT OR UPDATE OR DELETE ON members.routine_assignments
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

DROP TRIGGER IF EXISTS trg_audit_workout_logs ON members.workout_logs;
CREATE TRIGGER trg_audit_workout_logs
    AFTER INSERT OR UPDATE OR DELETE ON members.workout_logs
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- ============================================================
-- DATOS SEMILLA: una rutina demo asignada al miembro seed
-- (fingerprint_id = 1) para pruebas end-to-end.
-- ============================================================
DO $$
DECLARE
    v_admin_id   UUID;
    v_member_id  UUID;
    v_routine_id UUID;
    v_day_a      UUID;
    v_day_b      UUID;
    v_ex_squat   UUID;
    v_ex_bench   UUID;
    v_ex_row     UUID;
    v_ex_press   UUID;
BEGIN
    SELECT id INTO v_admin_id  FROM auth.users      WHERE email = 'admin@taurus.gym' LIMIT 1;
    SELECT id INTO v_member_id FROM members.members WHERE fingerprint_id = 1 LIMIT 1;

    -- Idempotente: solo sembrar si la rutina demo aun no existe.
    IF NOT EXISTS (SELECT 1 FROM members.routines WHERE name = 'Full Body Principiante') THEN
        -- Catalogo demo
        INSERT INTO members.exercises (name, description, muscle_group, equipment, created_by)
        VALUES ('Sentadilla', 'Sentadilla con barra, espalda recta.', 'Piernas', 'Barra', v_admin_id)
        RETURNING id INTO v_ex_squat;

        INSERT INTO members.exercises (name, description, muscle_group, equipment, created_by)
        VALUES ('Press de banca', 'Press horizontal en banco plano.', 'Pecho', 'Barra', v_admin_id)
        RETURNING id INTO v_ex_bench;

        INSERT INTO members.exercises (name, description, muscle_group, equipment, created_by)
        VALUES ('Remo con barra', 'Remo inclinado para espalda.', 'Espalda', 'Barra', v_admin_id)
        RETURNING id INTO v_ex_row;

        INSERT INTO members.exercises (name, description, muscle_group, equipment, created_by)
        VALUES ('Press militar', 'Press de hombros de pie.', 'Hombros', 'Barra', v_admin_id)
        RETURNING id INTO v_ex_press;

        -- Rutina demo con 2 dias
        INSERT INTO members.routines (name, description, level, goal, created_by)
        VALUES ('Full Body Principiante', 'Rutina de cuerpo completo en 2 dias.', 'beginner', 'hipertrofia', v_admin_id)
        RETURNING id INTO v_routine_id;

        INSERT INTO members.routine_days (routine_id, label, order_index)
        VALUES (v_routine_id, 'Dia A - Empuje', 0) RETURNING id INTO v_day_a;

        INSERT INTO members.routine_days (routine_id, label, order_index)
        VALUES (v_routine_id, 'Dia B - Traccion', 1) RETURNING id INTO v_day_b;

        INSERT INTO members.routine_exercises
            (routine_day_id, exercise_id, exercise_name, order_index, sets, reps, rest_seconds, notes)
        VALUES
            (v_day_a, v_ex_squat, 'Sentadilla',     0, 4, '8-10', 120, 'Calentar con series ligeras.'),
            (v_day_a, v_ex_bench, 'Press de banca', 1, 4, '8-12', 90,  NULL),
            (v_day_a, v_ex_press, 'Press militar',  2, 3, '10-12', 90, NULL),
            (v_day_b, v_ex_row,   'Remo con barra', 0, 4, '8-12', 90,  NULL),
            (v_day_b, v_ex_squat, 'Sentadilla',     1, 3, '10', 120,   'Tecnica controlada.');

        -- Asignar al miembro seed: Lun/Vie = Dia A, Mie = Dia B
        IF v_member_id IS NOT NULL THEN
            INSERT INTO members.routine_assignments
                (member_id, routine_id, assigned_by, day_mapping, starts_at, status)
            SELECT
                v_member_id, v_routine_id, v_admin_id,
                jsonb_build_object('monday', v_day_a, 'wednesday', v_day_b, 'friday', v_day_a),
                NOW(), 'active'
            WHERE NOT EXISTS (
                SELECT 1 FROM members.routine_assignments a
                WHERE a.member_id = v_member_id AND a.status = 'active'
            );
        END IF;
    END IF;
END $$;
