-- ============================================================================
-- Seed PostgreSQL: 10 usuarios de prueba para GymTaurus (base "taurus")
-- Esquemas: auth, members. NO toca audit.audit_log (lo llenan los triggers).
-- Idempotente: re-ejecutable sin errores ni duplicados (solo INSERTs).
-- Clave de los 10 usuarios: Member123!  (mismo hash bcrypt del miembro semilla)
-- Ejecucion:
--   psql "postgresql://taurus:taurus@localhost:5433/taurus" -f seeds/seed-10-users.sql
-- ============================================================================

BEGIN;

-- Actor de auditoria (audit.audit_log.actor_id): el admin semilla, si existe.
-- Debe ser un UUID valido o cadena vacia (seccion 4.3 del documento).
SELECT set_config(
  'app.current_user_id',
  COALESCE((SELECT id::text FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1), ''),
  false
);

-- ----------------------------------------------------------------------------
-- 1) auth.users — 10 cuentas role='member', clave Member123! (bcrypt cost 10)
--    UUIDs fijos aaaaaaaa-0000-4000-8000-0000000000NN (NN = 01..10)
-- ----------------------------------------------------------------------------
INSERT INTO auth.users (id, email, password_hash, role) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'atleta01@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'atleta02@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'atleta03@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'atleta04@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'atleta05@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'atleta06@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000007', 'atleta07@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'atleta08@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000009', 'atleta09@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'atleta10@taurus.gym', '$2b$10$ooJafm/A7.EYjgTF90.ynOKZil8ThtnvCxDo/R9EMm3V2Kr3YdBEG', 'member')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) members.members — perfiles con UUID fijo bbbbbbbb-...NN
--    created_by = admin semilla (o el primer atleta como respaldo, seccion 7.4)
--    Huellas 101..110 (la 1 esta tomada por el miembro semilla)
-- ----------------------------------------------------------------------------
INSERT INTO members.members (id, user_id, created_by, name, cedula, phone, email, fingerprint_id)
SELECT v.id::uuid, v.user_id::uuid, a.admin_id, v.name, v.cedula, v.phone, v.email, v.fingerprint_id
FROM (VALUES
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Ana Rodríguez',  '20000001', '584141000001', 'atleta01@taurus.gym', 101),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'Bruno Pérez',    '20000002', '584141000002', 'atleta02@taurus.gym', 102),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000003', 'Carla Gómez',    '20000003', '584241000003', 'atleta03@taurus.gym', 103),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000004', 'Diego Martínez', '20000004', '584241000004', 'atleta04@taurus.gym', 104),
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000005', 'Elena Suárez',   '20000005', '584161000005', 'atleta05@taurus.gym', 105),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000006', 'Felipe Castro',  '20000006', '584161000006', 'atleta06@taurus.gym', 106),
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000007', 'Gabriela Ríos',  '20000007', '584121000007', 'atleta07@taurus.gym', 107),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000008', 'Héctor Salas',   '20000008', '584121000008', 'atleta08@taurus.gym', 108),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000009', 'Irene Navas',    '20000009', '584261000009', 'atleta09@taurus.gym', 109),
  ('bbbbbbbb-0000-4000-8000-000000000010', 'aaaaaaaa-0000-4000-8000-000000000010', 'Javier Ortega',  '20000010', '584261000010', 'atleta10@taurus.gym', 110)
) AS v(id, user_id, name, cedula, phone, email, fingerprint_id)
CROSS JOIN (
  SELECT COALESCE(
    (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1),
    'aaaaaaaa-0000-4000-8000-000000000001'::uuid
  ) AS admin_id
) a
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3) members.subscriptions — una por miembro (maximo una 'active' por miembro)
--    UUIDs fijos cccccccc-...NN. plan_id resuelto POR NOMBRE.
--    starts_at = NOW() - offset_days; expires_at = starts_at + duration_days.
--    atleta01 y atleta07 (Mensual, offset 25) quedan con
--    expires_at = NOW() + 5 dias -> reporte "vencen pronto".
-- ----------------------------------------------------------------------------
INSERT INTO members.subscriptions (id, member_id, plan_id, status, starts_at, expires_at)
SELECT v.id::uuid, v.member_id::uuid, p.id, v.status,
       NOW() - (v.offset_days * INTERVAL '1 day'),
       NOW() - (v.offset_days * INTERVAL '1 day') + (p.duration_days * INTERVAL '1 day')
FROM (VALUES
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Mensual',    'active',    25),  -- vence en 5 dias
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Mensual',    'active',    10),  -- vence en 20 dias
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000003', 'Trimestral', 'active',    30),  -- vence en 60 dias
  ('cccccccc-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000004', 'Trimestral', 'active',    45),  -- vence en 45 dias
  ('cccccccc-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000005', 'Semestral',  'active',    60),  -- vence en 120 dias
  ('cccccccc-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000006', 'Anual',      'active',   100),  -- vence en 265 dias
  ('cccccccc-0000-4000-8000-000000000007', 'bbbbbbbb-0000-4000-8000-000000000007', 'Mensual',    'active',    25),  -- vence en 5 dias
  ('cccccccc-0000-4000-8000-000000000008', 'bbbbbbbb-0000-4000-8000-000000000008', 'Mensual',    'expired',   45),  -- vencio hace 15 dias
  ('cccccccc-0000-4000-8000-000000000009', 'bbbbbbbb-0000-4000-8000-000000000009', 'Trimestral', 'expired',  120),  -- vencio hace 30 dias
  ('cccccccc-0000-4000-8000-000000000010', 'bbbbbbbb-0000-4000-8000-000000000010', 'Anual',      'cancelled', 90)   -- cancelada a mitad de plan
) AS v(id, member_id, plan_name, status, offset_days)
JOIN members.membership_plans p ON p.name = v.plan_name
WHERE NOT EXISTS (SELECT 1 FROM members.subscriptions s WHERE s.id = v.id::uuid)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4) members.renewals — 4 renovaciones para metricas (tabla solo-lectura para
--    la app). UUIDs fijos dddddddd-...NN; renewed_at = starts_at de la
--    suscripcion vigente; renewed_by = admin semilla.
-- ----------------------------------------------------------------------------
INSERT INTO members.renewals (id, subscription_id, plan_id, renewed_at, new_expires_at, renewed_by)
SELECT v.id::uuid, v.subscription_id::uuid, p.id,
       NOW() - (v.offset_days * INTERVAL '1 day'),
       NOW() - (v.offset_days * INTERVAL '1 day') + (p.duration_days * INTERVAL '1 day'),
       a.admin_id
FROM (VALUES
  ('dddddddd-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', 'Mensual',     10),  -- renovacion de este mes
  ('dddddddd-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000003', 'Trimestral',  30),  -- renovacion del mes pasado
  ('dddddddd-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000004', 'Trimestral',  45),
  ('dddddddd-0000-4000-8000-000000000006', 'cccccccc-0000-4000-8000-000000000006', 'Anual',      100)
) AS v(id, subscription_id, plan_name, offset_days)
JOIN members.membership_plans p ON p.name = v.plan_name
CROSS JOIN (
  SELECT COALESCE(
    (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1),
    'aaaaaaaa-0000-4000-8000-000000000001'::uuid
  ) AS admin_id
) a
WHERE NOT EXISTS (SELECT 1 FROM members.renewals r WHERE r.id = v.id::uuid)
ON CONFLICT DO NOTHING;

COMMIT;

-- Fin del seed. Cada INSERT genero su fila en audit.audit_log via triggers.
