// ============================================================
// TAURUS GYM — MongoDB Init Script
// Database: taurus_access (access-service — Harwing)
// Ejecutar con: mongosh < init-mongo.js
// O montar como /docker-entrypoint-initdb.d/init-mongo.js
// ============================================================

db = db.getSiblingDB('taurus_access');

// ============================================================
// COLECCIÓN: access_logs
// Registro de cada evento de acceso biométrico
// ============================================================

db.createCollection('access_logs', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: [
                'member_id',
                'fingerprint_id',
                'member_name',
                'granted',
                'reason',
                'device_id',
                'timestamp',
            ],
            properties: {
                member_id: {
                    bsonType: 'string',
                    description: 'UUID del miembro en PostgreSQL',
                },
                fingerprint_id: {
                    bsonType: 'int',
                    description: 'ID de la plantilla en el sensor R307',
                },
                member_name: {
                    bsonType: 'string',
                    description:
                        'Nombre desnormalizado para evitar joins cross-database',
                },
                granted: {
                    bsonType: 'bool',
                    description: 'true = acceso concedido, false = denegado',
                },
                reason: {
                    enum: ['active', 'expired', 'not_found'],
                    description: 'Motivo del resultado del acceso',
                },
                device_id: {
                    bsonType: 'string',
                    description: 'Identificador del nodo ESP32',
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Momento exacto del evento',
                },
                synced: {
                    bsonType: 'bool',
                    description:
                        'false si vino de batch de sincronización offline',
                },
                checked_out_at: {
                    bsonType: ['date', 'null'],
                    description: 'Hora de salida (null si no ha salido)',
                },
                checkout_method: {
                    enum: ['manual', 'timeout', null],
                    description: 'Cómo se registró la salida',
                },
                duration_minutes: {
                    bsonType: ['int', 'null'],
                    description:
                        'Duración de la sesión en minutos (calculado al checkout)',
                },
            },
        },
    },
});

// Índices para access_logs
db.access_logs.createIndex({ timestamp: -1 }, { name: 'idx_timestamp' });

db.access_logs.createIndex(
    { member_id: 1, timestamp: -1 },
    { name: 'idx_member_history' },
);

db.access_logs.createIndex(
    { granted: 1, timestamp: -1 },
    { name: 'idx_denied_filter' },
);

db.access_logs.createIndex(
    { granted: 1, checked_out_at: 1, timestamp: 1 },
    { name: 'idx_open_sessions' },
);

// ============================================================
// COLECCIÓN: audit_trail
// Log inmutable de acciones administrativas y del sistema
// ============================================================

db.createCollection('audit_trail', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['action', 'target_type', 'timestamp'],
            properties: {
                action: {
                    enum: [
                        'member_created',
                        'member_updated',
                        'member_renewed',
                        'membership_expired',
                        'access_granted',
                        'access_denied',
                    ],
                    description: 'Tipo de acción registrada',
                },
                actor_id: {
                    bsonType: ['string', 'null'],
                    description:
                        'UUID del usuario que ejecutó la acción (null para sistema/cron)',
                },
                actor_email: {
                    bsonType: ['string', 'null'],
                    description: 'Email desnormalizado del actor',
                },
                target_type: {
                    enum: ['member', 'system'],
                    description: 'Tipo de entidad afectada',
                },
                target_id: {
                    bsonType: ['string', 'null'],
                    description: 'UUID de la entidad afectada',
                },
                details: {
                    bsonType: 'object',
                    description:
                        'Datos adicionales específicos por tipo de acción',
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Momento de la acción',
                },
            },
        },
    },
});

// Índices para audit_trail
db.audit_trail.createIndex({ timestamp: -1 }, { name: 'idx_audit_time' });

db.audit_trail.createIndex(
    { target_type: 1, target_id: 1, timestamp: -1 },
    { name: 'idx_audit_target' },
);

db.audit_trail.createIndex(
    { action: 1, timestamp: -1 },
    { name: 'idx_audit_action' },
);

// ============================================================
// DOCUMENTOS SEMILLA (para pruebas de desarrollo)
// ============================================================

db.access_logs.insertOne({
    member_id: '00000000-0000-0000-0000-000000000001',
    fingerprint_id: NumberInt(1),
    member_name: 'Miembro de prueba',
    granted: true,
    reason: 'active',
    device_id: 'esp32-recepcion',
    timestamp: new Date(),
    synced: true,
    checked_out_at: null,
    checkout_method: null,
    duration_minutes: null,
});

db.audit_trail.insertOne({
    action: 'access_granted',
    actor_id: null,
    actor_email: null,
    target_type: 'member',
    target_id: '00000000-0000-0000-0000-000000000001',
    details: {
        fingerprint_id: NumberInt(1),
        device_id: 'esp32-recepcion',
        days_left: NumberInt(30),
    },
    timestamp: new Date(),
});

print('');
print('=== Taurus Access DB inicializada ===');
print('Colecciones: access_logs, audit_trail');
print('Índices creados: 7');
print('Documentos semilla: 2');
print('');
