-- ============================================================================
-- Seed PostgreSQL: rutinas, ejercicios, asignaciones y diario de entrenamiento
-- Complementa a seeds/seed-10-users.sql (EJECUTAR DESPUES de ese script:
-- usa los miembros bbbbbbbb-...NN). Si un miembro no existe, su bloque se
-- omite en silencio.
-- Idempotente: re-ejecutable sin errores ni duplicados (solo INSERTs).
-- No toca audit.audit_log (lo llenan los triggers).
-- Ejecucion:
--   psql "postgresql://taurus:taurus@localhost:5433/taurus" -f seeds/seed-rutinas.sql
-- UUIDs fijos:
--   ejercicios e1e1e1e1-...NN | rutinas f1f1f1f1-...NN | dias f2f2f2f2-...NN
--   routine_exercises f3f3f3f3-...NN | asignaciones f4f4f4f4-...NN
--   horario f5f5f5f5-...NN | workout_logs f6f6f6f6-...NN | set_logs f7f7f7f7-...NN
-- ============================================================================

BEGIN;

-- Actor de auditoria: el admin semilla, si existe.
SELECT set_config(
  'app.current_user_id',
  COALESCE((SELECT id::text FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1), ''),
  false
);

-- ----------------------------------------------------------------------------
-- 1) Catalogo de ejercicios nuevos (los 5 del init.sql ya existen:
--    Sentadilla, Press de banca, Remo con barra, Press militar, Plancha).
--    name no tiene UNIQUE -> WHERE NOT EXISTS por id fijo Y por nombre.
-- ----------------------------------------------------------------------------
INSERT INTO members.exercises (id, name, description, muscle_group, equipment, measurement_type, created_by)
SELECT v.id::uuid, v.name, v.descr, v.grp, v.equip, v.mtype,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1)
FROM (VALUES
  ('e1e1e1e1-0000-4000-8000-000000000001', 'Peso muerto',           'Levantamiento desde el suelo con espalda neutra.', 'Espalda',  'Barra',          'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000002', 'Dominadas',             'Traccion vertical con peso corporal.',             'Espalda',  'Peso corporal',  'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000003', 'Zancadas',              'Paso largo alternando piernas.',                   'Piernas',  'Mancuernas',     'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000004', 'Curl de biceps',        'Flexion de codo con mancuernas.',                  'Brazos',   'Mancuernas',     'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000005', 'Fondos en paralelas',   'Empuje vertical para triceps y pecho.',            'Triceps',  'Peso corporal',  'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000006', 'Elevaciones laterales', 'Abduccion de hombro con mancuernas.',              'Hombros',  'Mancuernas',     'weight_reps'),
  ('e1e1e1e1-0000-4000-8000-000000000007', 'Trote en cinta',        'Cardio continuo a ritmo moderado.',                'Cardio',   'Cinta',          'time'),
  ('e1e1e1e1-0000-4000-8000-000000000008', 'Burpees',               'Ejercicio de cuerpo completo a repeticiones.',     'Full body','Peso corporal',  'reps'),
  ('e1e1e1e1-0000-4000-8000-000000000009', 'Abdominales',           'Flexion de tronco en el suelo.',                   'Core',     'Peso corporal',  'reps')
) AS v(id, name, descr, grp, equip, mtype)
WHERE NOT EXISTS (SELECT 1 FROM members.exercises e WHERE e.id = v.id::uuid OR e.name = v.name)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) Rutinas nuevas (la 'Full Body Principiante' ya existe en init.sql)
-- ----------------------------------------------------------------------------
INSERT INTO members.routines (id, name, description, level, goal, created_by)
SELECT v.id::uuid, v.name, v.descr, v.level, v.goal,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1)
FROM (VALUES
  ('f1f1f1f1-0000-4000-8000-000000000001', 'Push Pull Legs', 'Division clasica de empuje, traccion y pierna en 3 dias.', 'intermediate', 'hipertrofia'),
  ('f1f1f1f1-0000-4000-8000-000000000002', 'Cardio y Core',  'Resistencia y zona media en 2 dias, ideal para empezar.',  'beginner',     'resistencia')
) AS v(id, name, descr, level, goal)
WHERE NOT EXISTS (SELECT 1 FROM members.routines r WHERE r.id = v.id::uuid OR r.name = v.name)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3) Dias de cada rutina
-- ----------------------------------------------------------------------------
INSERT INTO members.routine_days (id, routine_id, label, order_index)
SELECT v.id::uuid, v.routine_id::uuid, v.label, v.ord
FROM (VALUES
  ('f2f2f2f2-0000-4000-8000-000000000001', 'f1f1f1f1-0000-4000-8000-000000000001', 'Dia 1 - Push',   0),
  ('f2f2f2f2-0000-4000-8000-000000000002', 'f1f1f1f1-0000-4000-8000-000000000001', 'Dia 2 - Pull',   1),
  ('f2f2f2f2-0000-4000-8000-000000000003', 'f1f1f1f1-0000-4000-8000-000000000001', 'Dia 3 - Legs',   2),
  ('f2f2f2f2-0000-4000-8000-000000000004', 'f1f1f1f1-0000-4000-8000-000000000002', 'Dia A - Cardio', 0),
  ('f2f2f2f2-0000-4000-8000-000000000005', 'f1f1f1f1-0000-4000-8000-000000000002', 'Dia B - Core',   1)
) AS v(id, routine_id, label, ord)
JOIN members.routines r ON r.id = v.routine_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.routine_days d WHERE d.id = v.id::uuid)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4) Ejercicios de cada dia. exercise_id se resuelve POR NOMBRE (los del
--    init.sql tienen UUID aleatorio); si faltara, queda NULL y el nombre
--    snapshot (exercise_name) mantiene la informacion.
-- ----------------------------------------------------------------------------
INSERT INTO members.routine_exercises
  (id, routine_day_id, exercise_id, exercise_name, order_index, sets, reps, rest_seconds, measurement_type, duration_seconds, notes)
SELECT v.id::uuid, v.day_id::uuid,
       (SELECT e.id FROM members.exercises e WHERE e.name = v.exname ORDER BY e.created_at LIMIT 1),
       v.exname, v.ord, v.sets, v.reps, v.rest, v.mtype, v.dur, v.notes
FROM (VALUES
  -- Push Pull Legs · Dia 1 - Push
  ('f3f3f3f3-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000001', 'Press de banca',        0, 4, '8-12',  90,  'weight_reps', NULL::int, 'Calentar con series ligeras.'),
  ('f3f3f3f3-0000-4000-8000-000000000002', 'f2f2f2f2-0000-4000-8000-000000000001', 'Press militar',         1, 3, '10-12', 90,  'weight_reps', NULL, NULL),
  ('f3f3f3f3-0000-4000-8000-000000000003', 'f2f2f2f2-0000-4000-8000-000000000001', 'Fondos en paralelas',   2, 3, '10',    90,  'weight_reps', NULL, NULL),
  -- Push Pull Legs · Dia 2 - Pull
  ('f3f3f3f3-0000-4000-8000-000000000004', 'f2f2f2f2-0000-4000-8000-000000000002', 'Dominadas',             0, 4, '6-10',  120, 'weight_reps', NULL, 'Asistidas si hace falta.'),
  ('f3f3f3f3-0000-4000-8000-000000000005', 'f2f2f2f2-0000-4000-8000-000000000002', 'Remo con barra',        1, 4, '8-12',  90,  'weight_reps', NULL, NULL),
  ('f3f3f3f3-0000-4000-8000-000000000006', 'f2f2f2f2-0000-4000-8000-000000000002', 'Curl de biceps',        2, 3, '12',    60,  'weight_reps', NULL, NULL),
  -- Push Pull Legs · Dia 3 - Legs
  ('f3f3f3f3-0000-4000-8000-000000000007', 'f2f2f2f2-0000-4000-8000-000000000003', 'Sentadilla',            0, 4, '8-10',  120, 'weight_reps', NULL, NULL),
  ('f3f3f3f3-0000-4000-8000-000000000008', 'f2f2f2f2-0000-4000-8000-000000000003', 'Peso muerto',           1, 3, '6-8',   180, 'weight_reps', NULL, 'Tecnica primero, peso despues.'),
  ('f3f3f3f3-0000-4000-8000-000000000009', 'f2f2f2f2-0000-4000-8000-000000000003', 'Zancadas',              2, 3, '12',    90,  'weight_reps', NULL, NULL),
  -- Cardio y Core · Dia A - Cardio
  ('f3f3f3f3-0000-4000-8000-000000000010', 'f2f2f2f2-0000-4000-8000-000000000004', 'Trote en cinta',        0, 1, '1',     120, 'time',        1200, 'Ritmo conversacional.'),
  ('f3f3f3f3-0000-4000-8000-000000000011', 'f2f2f2f2-0000-4000-8000-000000000004', 'Burpees',               1, 3, '15',    60,  'reps',        NULL, NULL),
  -- Cardio y Core · Dia B - Core
  ('f3f3f3f3-0000-4000-8000-000000000012', 'f2f2f2f2-0000-4000-8000-000000000005', 'Plancha',               0, 3, '1',     60,  'time',        60,   'Mantener cadera neutra.'),
  ('f3f3f3f3-0000-4000-8000-000000000013', 'f2f2f2f2-0000-4000-8000-000000000005', 'Abdominales',           1, 3, '20',    45,  'reps',        NULL, NULL)
) AS v(id, day_id, exname, ord, sets, reps, rest, mtype, dur, notes)
JOIN members.routine_days d ON d.id = v.day_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.routine_exercises re WHERE re.id = v.id::uuid)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5) Asignaciones (indice unico parcial: UNA sola 'active' por miembro).
--    Ana y Felipe -> Push Pull Legs · Carla -> Cardio y Core (activas)
--    Hector (vencido) -> Push Pull Legs en 'paused' (no viola el indice)
--    Bruno -> rutina existente 'Full Body Principiante' (resuelta por nombre)
-- ----------------------------------------------------------------------------
INSERT INTO members.routine_assignments (id, member_id, routine_id, assigned_by, day_mapping, starts_at, status)
SELECT v.id::uuid, v.member_id::uuid, v.routine_id::uuid,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1),
       v.day_mapping::jsonb,
       NOW() - (v.days_ago * INTERVAL '1 day'), v.status
FROM (VALUES
  ('f4f4f4f4-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'f1f1f1f1-0000-4000-8000-000000000001',
   '{"monday":"f2f2f2f2-0000-4000-8000-000000000001","wednesday":"f2f2f2f2-0000-4000-8000-000000000002","friday":"f2f2f2f2-0000-4000-8000-000000000003"}', 20, 'active'),
  ('f4f4f4f4-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000003', 'f1f1f1f1-0000-4000-8000-000000000002',
   '{"monday":"f2f2f2f2-0000-4000-8000-000000000004","thursday":"f2f2f2f2-0000-4000-8000-000000000005"}', 12, 'active'),
  ('f4f4f4f4-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000006', 'f1f1f1f1-0000-4000-8000-000000000001',
   '{"tuesday":"f2f2f2f2-0000-4000-8000-000000000001","thursday":"f2f2f2f2-0000-4000-8000-000000000002","saturday":"f2f2f2f2-0000-4000-8000-000000000003"}', 30, 'active'),
  ('f4f4f4f4-0000-4000-8000-000000000008', 'bbbbbbbb-0000-4000-8000-000000000008', 'f1f1f1f1-0000-4000-8000-000000000001',
   '{"monday":"f2f2f2f2-0000-4000-8000-000000000001","wednesday":"f2f2f2f2-0000-4000-8000-000000000002"}', 50, 'paused')
) AS v(id, member_id, routine_id, day_mapping, days_ago, status)
JOIN members.members m  ON m.id = v.member_id::uuid
JOIN members.routines r ON r.id = v.routine_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.routine_assignments a WHERE a.id = v.id::uuid)
  AND NOT EXISTS (SELECT 1 FROM members.routine_assignments a
                  WHERE a.member_id = v.member_id::uuid AND a.status = 'active')
ON CONFLICT DO NOTHING;

-- Bruno -> 'Full Body Principiante' (ids de rutina/dias del init.sql son aleatorios)
INSERT INTO members.routine_assignments (id, member_id, routine_id, assigned_by, day_mapping, starts_at, status)
SELECT 'f4f4f4f4-0000-4000-8000-000000000002'::uuid,
       'bbbbbbbb-0000-4000-8000-000000000002'::uuid,
       r.id,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1),
       jsonb_build_object(
         'tuesday',  (SELECT d.id::text FROM members.routine_days d WHERE d.routine_id = r.id ORDER BY d.order_index LIMIT 1),
         'thursday', (SELECT d.id::text FROM members.routine_days d WHERE d.routine_id = r.id ORDER BY d.order_index OFFSET 1 LIMIT 1)
       ),
       NOW() - INTERVAL '15 days', 'active'
FROM members.routines r
JOIN members.members m ON m.id = 'bbbbbbbb-0000-4000-8000-000000000002'::uuid
WHERE r.name = 'Full Body Principiante'
  AND NOT EXISTS (SELECT 1 FROM members.routine_assignments a
                  WHERE a.id = 'f4f4f4f4-0000-4000-8000-000000000002'::uuid)
  AND NOT EXISTS (SELECT 1 FROM members.routine_assignments a
                  WHERE a.member_id = 'bbbbbbbb-0000-4000-8000-000000000002'::uuid AND a.status = 'active')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6) Horario semanal (UNIQUE member_id + weekday) espejo de las asignaciones
-- ----------------------------------------------------------------------------
INSERT INTO members.member_schedule (id, member_id, weekday, routine_id, routine_day_id, assigned_by)
SELECT v.id::uuid, v.member_id::uuid, v.weekday, v.routine_id::uuid, v.day_id::uuid,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1)
FROM (VALUES
  -- Ana: lunes/miercoles/viernes -> PPL
  ('f5f5f5f5-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'monday',    'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000001'),
  ('f5f5f5f5-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001', 'wednesday', 'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000002'),
  ('f5f5f5f5-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000001', 'friday',    'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000003'),
  -- Carla: lunes/jueves -> Cardio y Core
  ('f5f5f5f5-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000003', 'monday',    'f1f1f1f1-0000-4000-8000-000000000002', 'f2f2f2f2-0000-4000-8000-000000000004'),
  ('f5f5f5f5-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000003', 'thursday',  'f1f1f1f1-0000-4000-8000-000000000002', 'f2f2f2f2-0000-4000-8000-000000000005'),
  -- Felipe: martes/jueves/sabado -> PPL
  ('f5f5f5f5-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000006', 'tuesday',   'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000001'),
  ('f5f5f5f5-0000-4000-8000-000000000007', 'bbbbbbbb-0000-4000-8000-000000000006', 'thursday',  'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000002'),
  ('f5f5f5f5-0000-4000-8000-000000000008', 'bbbbbbbb-0000-4000-8000-000000000006', 'saturday',  'f1f1f1f1-0000-4000-8000-000000000001', 'f2f2f2f2-0000-4000-8000-000000000003')
) AS v(id, member_id, weekday, routine_id, day_id)
JOIN members.members m       ON m.id = v.member_id::uuid
JOIN members.routine_days d  ON d.id = v.day_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.member_schedule s WHERE s.id = v.id::uuid)
ON CONFLICT DO NOTHING;

-- Bruno: martes/jueves -> Full Body Principiante (resuelto por nombre)
INSERT INTO members.member_schedule (id, member_id, weekday, routine_id, routine_day_id, assigned_by)
SELECT v.id::uuid, 'bbbbbbbb-0000-4000-8000-000000000002'::uuid, v.weekday, r.id, d.id,
       (SELECT id FROM auth.users WHERE email = 'admin@taurus.gym' LIMIT 1)
FROM (VALUES
  ('f5f5f5f5-0000-4000-8000-000000000009', 'tuesday',  0),
  ('f5f5f5f5-0000-4000-8000-000000000010', 'thursday', 1)
) AS v(id, weekday, day_ord)
JOIN members.routines r ON r.name = 'Full Body Principiante'
JOIN members.routine_days d ON d.routine_id = r.id AND d.order_index = v.day_ord
JOIN members.members m ON m.id = 'bbbbbbbb-0000-4000-8000-000000000002'::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.member_schedule s WHERE s.id = v.id::uuid)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7) Diario de entrenamiento: workout_logs + set_logs (Ana y Felipe)
-- ----------------------------------------------------------------------------
INSERT INTO members.workout_logs (id, member_id, assignment_id, routine_day_id, day_label, performed_on, status, notes)
SELECT v.id::uuid, v.member_id::uuid, v.assignment_id::uuid, v.day_id::uuid, v.label, v.performed::date, v.status, v.notes
FROM (VALUES
  ('f6f6f6f6-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'f4f4f4f4-0000-4000-8000-000000000001',
   'f2f2f2f2-0000-4000-8000-000000000001', 'Dia 1 - Push', '2026-07-21', 'completed', 'Buena sesion, subio el press.'),
  ('f6f6f6f6-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001', 'f4f4f4f4-0000-4000-8000-000000000001',
   'f2f2f2f2-0000-4000-8000-000000000002', 'Dia 2 - Pull', '2026-07-23', 'completed', NULL),
  ('f6f6f6f6-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000006', 'f4f4f4f4-0000-4000-8000-000000000006',
   'f2f2f2f2-0000-4000-8000-000000000003', 'Dia 3 - Legs', '2026-07-22', 'partial', 'Corto por molestia leve en rodilla.')
) AS v(id, member_id, assignment_id, day_id, label, performed, status, notes)
JOIN members.members m             ON m.id = v.member_id::uuid
JOIN members.routine_assignments a ON a.id = v.assignment_id::uuid
JOIN members.routine_days d        ON d.id = v.day_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.workout_logs w WHERE w.id = v.id::uuid)
ON CONFLICT DO NOTHING;

INSERT INTO members.set_logs (id, workout_log_id, routine_exercise_id, exercise_name, set_number, reps_done, weight_done, done)
SELECT v.id::uuid, v.log_id::uuid, v.rex_id::uuid, v.exname, v.setn, v.reps, v.weight, v.done
FROM (VALUES
  -- Ana · Push (21-jul)
  ('f7f7f7f7-0000-4000-8000-000000000001', 'f6f6f6f6-0000-4000-8000-000000000001', 'f3f3f3f3-0000-4000-8000-000000000001', 'Press de banca', 1, 10, 40.00, true),
  ('f7f7f7f7-0000-4000-8000-000000000002', 'f6f6f6f6-0000-4000-8000-000000000001', 'f3f3f3f3-0000-4000-8000-000000000001', 'Press de banca', 2, 8,  45.00, true),
  ('f7f7f7f7-0000-4000-8000-000000000003', 'f6f6f6f6-0000-4000-8000-000000000001', 'f3f3f3f3-0000-4000-8000-000000000002', 'Press militar',  1, 12, 20.00, true),
  -- Ana · Pull (23-jul)
  ('f7f7f7f7-0000-4000-8000-000000000004', 'f6f6f6f6-0000-4000-8000-000000000002', 'f3f3f3f3-0000-4000-8000-000000000004', 'Dominadas',      1, 8,  NULL,  true),
  ('f7f7f7f7-0000-4000-8000-000000000005', 'f6f6f6f6-0000-4000-8000-000000000002', 'f3f3f3f3-0000-4000-8000-000000000005', 'Remo con barra', 1, 10, 50.00, true),
  -- Felipe · Legs (22-jul, parcial)
  ('f7f7f7f7-0000-4000-8000-000000000006', 'f6f6f6f6-0000-4000-8000-000000000003', 'f3f3f3f3-0000-4000-8000-000000000007', 'Sentadilla',     1, 10, 60.00, true),
  ('f7f7f7f7-0000-4000-8000-000000000007', 'f6f6f6f6-0000-4000-8000-000000000003', 'f3f3f3f3-0000-4000-8000-000000000008', 'Peso muerto',    1, 6,  80.00, false)
) AS v(id, log_id, rex_id, exname, setn, reps, weight, done)
JOIN members.workout_logs w       ON w.id = v.log_id::uuid
JOIN members.routine_exercises re ON re.id = v.rex_id::uuid
WHERE NOT EXISTS (SELECT 1 FROM members.set_logs s WHERE s.id = v.id::uuid)
ON CONFLICT DO NOTHING;

COMMIT;

-- Fin. Resultado esperado: 9 ejercicios nuevos, 2 rutinas (5 dias, 13
-- ejercicios de dia), 5 asignaciones (4 activas + 1 pausada), 10 filas de
-- horario semanal y un diario con 3 sesiones y 7 series.
