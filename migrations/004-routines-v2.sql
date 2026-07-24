-- ============================================================
-- 004 - Rutinas v2: tipos de medición + horario semanal
--
-- 1) measurement_type por ejercicio (weight_reps | reps | time | distance)
--    + campos de prescripción/registro para tiempo y distancia.
-- 2) Horario semanal por miembro: cada día de la semana puede apuntar a una
--    rutina y a un día concreto de esa rutina (member_schedule), en vez de una
--    sola rutina repartida (routine_assignments.day_mapping).
--
-- Idempotente. En entornos ya inicializados aplicar a mano:
--   docker exec -i gymtaurus-postgres-1 psql -U taurus -d taurus < migrations/004-routines-v2.sql
-- ============================================================

-- ── 1) Tipos de medición ───────────────────────────────────
ALTER TABLE members.exercises
    ADD COLUMN IF NOT EXISTS measurement_type VARCHAR(20) NOT NULL DEFAULT 'weight_reps';

ALTER TABLE members.routine_exercises
    ADD COLUMN IF NOT EXISTS measurement_type VARCHAR(20) NOT NULL DEFAULT 'weight_reps';
ALTER TABLE members.routine_exercises
    ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE members.routine_exercises
    ADD COLUMN IF NOT EXISTS distance VARCHAR(40);

ALTER TABLE members.set_logs
    ADD COLUMN IF NOT EXISTS duration_done INT;
ALTER TABLE members.set_logs
    ADD COLUMN IF NOT EXISTS distance_done DECIMAL(8,2);

-- ── 2) Horario semanal por miembro ─────────────────────────
-- Cada (miembro, día de semana) apunta a una rutina + un día de esa rutina.
-- Sin fila = descanso. Distintos días pueden usar rutinas distintas.
CREATE TABLE IF NOT EXISTS members.member_schedule (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID        NOT NULL REFERENCES members.members(id) ON DELETE CASCADE,
    weekday         VARCHAR(10) NOT NULL
                       CHECK (weekday IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
    routine_id      UUID        NOT NULL REFERENCES members.routines(id) ON DELETE CASCADE,
    routine_day_id  UUID        NOT NULL REFERENCES members.routine_days(id) ON DELETE CASCADE,
    assigned_by     UUID,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_member_schedule_day
    ON members.member_schedule(member_id, weekday);
CREATE INDEX IF NOT EXISTS idx_member_schedule_member
    ON members.member_schedule(member_id);
CREATE INDEX IF NOT EXISTS idx_member_schedule_routine
    ON members.member_schedule(routine_id);

DROP TRIGGER IF EXISTS trg_member_schedule_updated_at ON members.member_schedule;
CREATE TRIGGER trg_member_schedule_updated_at
    BEFORE UPDATE ON members.member_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_audit_member_schedule ON members.member_schedule;
CREATE TRIGGER trg_audit_member_schedule
    AFTER INSERT OR UPDATE OR DELETE ON members.member_schedule
    FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- ── 3) Migrar day_mapping de asignaciones activas → member_schedule ──
INSERT INTO members.member_schedule (member_id, weekday, routine_id, routine_day_id, assigned_by)
SELECT a.member_id, kv.key, a.routine_id, kv.value::uuid, a.assigned_by
FROM members.routine_assignments a
CROSS JOIN LATERAL jsonb_each_text(a.day_mapping) AS kv(key, value)
WHERE a.status = 'active'
  AND kv.value IS NOT NULL
  AND kv.value <> ''
ON CONFLICT (member_id, weekday) DO NOTHING;

-- ── 4) Ejercicio demo por tiempo (plancha) para el catálogo ──
INSERT INTO members.exercises (name, description, muscle_group, equipment, measurement_type, created_by)
SELECT 'Plancha', 'Plancha isométrica: mantén la posición.', 'Core', 'Peso corporal', 'time',
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM members.exercises WHERE name = 'Plancha');
