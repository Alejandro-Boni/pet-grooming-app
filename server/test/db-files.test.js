const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dbDir = path.join(__dirname, '../src/db');
const read = (...p) => fs.readFileSync(path.join(dbDir, ...p), 'utf8');

test('schema.sql es solo estructura: los datos de ejemplo viven en seed.sql', () => {
  assert.doesNotMatch(read('schema.sql'), /INSERT INTO/i);
  const seed = read('seed.sql');
  for (const table of ['settings', 'business_hours', 'services']) {
    assert.match(seed, new RegExp(`INSERT INTO ${table}`));
  }
  // Cada INSERT del seed debe ser idempotente.
  assert.equal((seed.match(/INSERT INTO/g) || []).length, (seed.match(/ON CONFLICT/g) || []).length);
});

test('las migraciones se nombran con prefijo numérico consecutivo (el runner las ordena por nombre)', () => {
  const files = fs.readdirSync(path.join(dbDir, 'migrations')).filter((f) => f.endsWith('.sql')).sort();
  files.forEach((f, i) => assert.ok(f.startsWith(String(i + 1).padStart(3, '0') + '_'), `${f} debería empezar con ${String(i + 1).padStart(3, '0')}_`));
});

test('las migraciones que cambian restricciones no dependen del nombre por defecto', () => {
  assert.match(read('migrations', '002_gigante_and_blackout_checks.sql'), /pg_constraint/);
  const m3 = read('migrations', '003_pets_archive_and_history_protection.sql');
  assert.match(m3, /pg_constraint/);
  assert.doesNotMatch(m3, /ON DELETE CASCADE\s*;?\s*$/m); // la llave nueva no debe volver a ser CASCADE
});

test('el esquema base ya refleja las columnas/restricciones nuevas (bases nuevas)', () => {
  const schema = read('schema.sql');
  assert.match(schema, /size TEXT NOT NULL CHECK \(size IN \('pequeño', 'mediano', 'grande', 'gigante'\)\)/);
  assert.match(schema, /deleted_at TIMESTAMPTZ/);
  assert.match(schema, /pet_id INTEGER NOT NULL REFERENCES pets\(id\),/);
});

test('el esquema reproduce la base de producción (recordatorios con UUID y CHECK, índice único de servicios)', () => {
  const schema = read('schema.sql');
  assert.match(schema, /appointment_reminders \(\s*id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  assert.match(schema, /CHECK \(type IN \('service_finished', 'pickup_ready'\)\)/);
  assert.match(schema, /CHECK \(status IN \('pending', 'sent', 'failed'\)\)/);
  assert.match(schema, /services_name_unique_idx ON services \(LOWER\(TRIM\(name\)\)\)/);
  assert.match(schema, /client_phone VARCHAR\(20\)/);
  for (const col of ['reminder_status', 'reminder_sent_at', 'pickup_reminder_status', 'pickup_reminder_sent_at']) {
    assert.match(schema, new RegExp(col));
    assert.match(read('migrations', '004_appointments_reminder_columns.sql'), new RegExp(`ADD COLUMN IF NOT EXISTS ${col}`));
  }
});

test('el esquema y la migración soportan el tiempo de recogida y sus recargos', () => {
  const schema = read('schema.sql');
  const migration = read('migrations', '005_appointment_pickup_fees.sql');
  for (const column of ['service_finished_at', 'picked_up_at', 'late_pickup_fee_cop']) {
    assert.match(schema, new RegExp(column));
    assert.match(migration, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`));
  }
});

test('la migración de servicios múltiples conserva y relaciona los servicios de citas existentes', () => {
  const schema = read('schema.sql');
  const migration = read('migrations', '006_appointment_services.sql');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS appointment_services/);
  assert.match(migration, /INSERT INTO appointment_services/);
  assert.match(migration, /a\.service_id/);
  assert.match(migration, /ON CONFLICT \(appointment_id, service_id\) DO NOTHING/);
});

test('PROTECCIÓN: el runner ejecuta toda migración nueva sobre producción, así que ninguna puede ser destructiva', () => {
  const dir = path.join(dbDir, 'migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8').replace(/--.*$/gm, '');
    assert.doesNotMatch(sql, /DROP\s+TABLE/i, `${f} no debe borrar tablas`);
    assert.doesNotMatch(sql, /DELETE\s+FROM\s+(services|appointments|pets|users|reviews|appointment_reminders)\b/i, `${f} no debe borrar datos de negocio`);
    assert.doesNotMatch(sql, /TRUNCATE/i, `${f} no debe vaciar tablas`);
  }
});
