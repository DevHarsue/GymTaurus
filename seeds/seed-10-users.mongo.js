// ============================================================================
// Seed MongoDB: access_logs + audit_trail para los 10 usuarios del seed SQL
// Base: taurus_access. Ejecutar con:
//   mongosh "mongodb://localhost:27018/taurus_access" seeds/seed-10-users.mongo.js
// Idempotente: los duplicados E11000 (indice unico uniq_dedupe_sync sobre
// fingerprint_id + timestamp + device_id) se omiten, y audit_trail usa upsert.
// SOLO inserta: nada de deleteMany/drop/remove/updateMany destructivo.
// ============================================================================

const taurus = db.getSiblingDB('taurus_access');

const DEVICE = 'esp32-recepcion'; // unico device autorizado por MQTT
const SENTINEL = '00000000-0000-0000-0000-000000000000'; // huella desconocida
const pad = (n) => String(n).padStart(2, '0');

// Miembros: mismo UUID de members.members (bbbbbbbb-...NN) y nombre que en SQL
const M = {};
[
  [1,  'Ana Rodríguez',  101],
  [2,  'Bruno Pérez',    102],
  [3,  'Carla Gómez',    103],
  [4,  'Diego Martínez', 104],
  [5,  'Elena Suárez',   105],
  [6,  'Felipe Castro',  106],
  [7,  'Gabriela Ríos',  107],
  [8,  'Héctor Salas',   108],
  [9,  'Irene Navas',    109],
  [10, 'Javier Ortega',  110]
].forEach(([n, name, fp]) => {
  M[n] = { id: 'bbbbbbbb-0000-4000-8000-0000000000' + pad(n), name: name, fp: fp };
});

// Construye un access_log con la forma exacta que escribe access-service.
// fingerprint_id y duration_minutes en NumberInt (int32): el validador
// $jsonSchema rechaza doubles de JS.
function log(member, iso, reason, granted, opts) {
  opts = opts || {};
  return {
    member_id: member.id,
    fingerprint_id: NumberInt(member.fp),
    member_name: member.name,
    granted: granted,
    reason: reason,
    device_id: DEVICE,
    timestamp: new Date(iso),
    synced: opts.synced === undefined ? true : opts.synced,
    checked_out_at: opts.out ? new Date(opts.out) : null,
    checkout_method: opts.method || null,
    duration_minutes: opts.min === undefined ? null : NumberInt(opts.min)
  };
}

// Timestamps fijos de junio/julio 2026 (ultimos ~30 dias antes del 2026-07-26),
// horas 06:xx-20:xx, TODOS distintos (indice unico uniq_dedupe_sync).
const docs = [
  // 01 Ana Rodríguez (activa) — 5 accesos, 1 sesion cerrada manual
  log(M[1], '2026-07-01T06:45:00Z', 'active', true),
  log(M[1], '2026-07-06T07:10:00Z', 'active', true, { out: '2026-07-06T08:25:00Z', method: 'manual', min: 75 }),
  log(M[1], '2026-07-11T18:30:00Z', 'active', true),
  log(M[1], '2026-07-18T06:55:00Z', 'active', true),
  log(M[1], '2026-07-24T19:05:00Z', 'active', true),

  // 02 Bruno Pérez (activo) — 4 accesos, 1 llegado por batch offline
  log(M[2], '2026-06-28T08:20:00Z', 'active', true),
  log(M[2], '2026-07-05T17:40:00Z', 'active', true),
  log(M[2], '2026-07-14T06:30:00Z', 'active', true, { synced: false }),
  log(M[2], '2026-07-22T20:10:00Z', 'active', true),

  // 03 Carla Gómez (activa) — 5 accesos, 1 sesion cerrada manual
  log(M[3], '2026-06-29T09:15:00Z', 'active', true),
  log(M[3], '2026-07-03T18:05:00Z', 'active', true),
  log(M[3], '2026-07-09T07:25:00Z', 'active', true),
  log(M[3], '2026-07-16T19:45:00Z', 'active', true, { out: '2026-07-16T21:15:00Z', method: 'manual', min: 90 }),
  log(M[3], '2026-07-23T06:50:00Z', 'active', true),

  // 04 Diego Martínez (activo) — 4 accesos
  log(M[4], '2026-07-02T12:30:00Z', 'active', true),
  log(M[4], '2026-07-10T13:15:00Z', 'active', true),
  log(M[4], '2026-07-17T07:40:00Z', 'active', true),
  log(M[4], '2026-07-25T09:20:00Z', 'active', true),

  // 05 Elena Suárez (activa) — 3 accesos, 1 batch offline
  log(M[5], '2026-07-04T16:10:00Z', 'active', true),
  log(M[5], '2026-07-13T06:35:00Z', 'active', true, { synced: false }),
  log(M[5], '2026-07-21T18:50:00Z', 'active', true),

  // 06 Felipe Castro (activo) — 6 accesos
  log(M[6], '2026-06-27T07:05:00Z', 'active', true),
  log(M[6], '2026-07-01T19:30:00Z', 'active', true),
  log(M[6], '2026-07-07T06:20:00Z', 'active', true),
  log(M[6], '2026-07-12T17:15:00Z', 'active', true),
  log(M[6], '2026-07-19T08:45:00Z', 'active', true),
  log(M[6], '2026-07-24T06:40:00Z', 'active', true),

  // 07 Gabriela Ríos (activa) — 3 accesos, 1 batch offline
  log(M[7], '2026-07-08T10:25:00Z', 'active', true),
  log(M[7], '2026-07-15T14:55:00Z', 'active', true),
  log(M[7], '2026-07-23T19:35:00Z', 'active', true, { synced: false }),

  // 08 Héctor Salas (vencido) — 2 accesos denegados
  log(M[8], '2026-07-18T17:20:00Z', 'expired', false),
  log(M[8], '2026-07-24T07:50:00Z', 'expired', false),

  // 09 Irene Navas (vencida) — 1 acceso denegado
  log(M[9], '2026-07-20T18:15:00Z', 'expired', false),

  // 10 Javier Ortega (cancelado) — 2 accesos denegados
  log(M[10], '2026-07-14T09:40:00Z', 'expired', false),
  log(M[10], '2026-07-22T16:05:00Z', 'expired', false),

  // Huella desconocida (slot 999 sin enrolar) — member_id centinela
  log({ id: SENTINEL, name: 'No encontrado', fp: 999 }, '2026-07-19T15:30:00Z', 'not_found', false)
];

// --- access_logs: insercion tolerante a duplicados (re-ejecucion) -----------
let insertedLogs = 0;
let skippedLogs = 0;
try {
  const res = taurus.access_logs.insertMany(docs, { ordered: false });
  insertedLogs = Object.keys(res.insertedIds).length;
} catch (e) {
  const we = e.writeErrors || (e.result && e.result.writeErrors) || [];
  const nonDup = we.filter((w) => w.code !== 11000);
  if (we.length === 0 || nonDup.length > 0) {
    throw e; // error distinto a duplicados E11000: propagar
  }
  skippedLogs = we.length;
  insertedLogs = docs.length - skippedLogs;
}

// --- audit_trail: gemelo de cada access_log via upsert (sin indice unico) ---
let auditInserted = 0;
let auditExisting = 0;
docs.forEach((d) => {
  const action = d.granted ? 'access_granted' : 'access_denied';
  const res = taurus.audit_trail.updateOne(
    { action: action, target_id: d.member_id, timestamp: d.timestamp },
    {
      $setOnInsert: {
        action: action,
        actor_id: null,       // null = dispositivo/sistema
        actor_email: null,
        target_type: 'member',
        target_id: d.member_id,
        details: {
          fingerprint_id: d.fingerprint_id, // ya es NumberInt
          device_id: d.device_id,
          reason: d.reason
        },
        timestamp: d.timestamp // mismo instante que el access_log
      }
    },
    { upsert: true }
  );
  if (res.upsertedCount === 1) {
    auditInserted++;
  } else {
    auditExisting++;
  }
});

// --- Resumen -----------------------------------------------------------------
print('--- Seed taurus_access completado ---');
print('access_logs : ' + insertedLogs + ' insertados, ' + skippedLogs + ' omitidos (duplicados E11000)');
print('audit_trail : ' + auditInserted + ' insertados, ' + auditExisting + ' ya existentes (upsert)');
print('Miembros cubiertos: 10 (7 activos, 2 vencidos, 1 cancelado) + 1 huella desconocida');
