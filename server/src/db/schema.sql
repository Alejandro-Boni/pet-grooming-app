-- Esquema de base de datos: Peluquería / Spa de Mascotas
-- PostgreSQL 14+

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato')),
  breed TEXT,
  age_years NUMERIC(4,1),
  weight_kg NUMERIC(5,2),
  size TEXT NOT NULL CHECK (size IN ('pequeño', 'mediano', 'grande')),
  is_reactive BOOLEAN NOT NULL DEFAULT false,
  is_allergic BOOLEAN NOT NULL DEFAULT false,
  allergy_notes TEXT,
  is_geriatric BOOLEAN NOT NULL DEFAULT false,
  medical_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_duration_minutes INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Horario de atención por día de la semana (0 = domingo ... 6 = sábado)
CREATE TABLE IF NOT EXISTS business_hours (
  day_of_week INTEGER PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME
);

-- Bloqueos de disponibilidad: si start_time/end_time son NULL, bloquea el día completo
CREATE TABLE IF NOT EXISTS availability_blocks (
  id SERIAL PRIMARY KEY,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuración simple clave/valor (ej. cupo máximo de mascotas simultáneas)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  address TEXT NOT NULL,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  stylist_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets (owner_id);

-- Datos iniciales
-- Con un solo vehículo móvil solo se puede atender una mascota a la vez;
-- si en el futuro suman una segunda unidad, este valor puede subirse (ver README).
INSERT INTO settings (key, value) VALUES ('max_concurrent_pets', '1')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO business_hours (day_of_week, is_closed, open_time, close_time) VALUES
  (0, true, NULL, NULL),
  (1, false, '09:00', '18:00'),
  (2, false, '09:00', '18:00'),
  (3, false, '09:00', '18:00'),
  (4, false, '09:00', '18:00'),
  (5, false, '09:00', '18:00'),
  (6, false, '09:00', '15:00')
ON CONFLICT (day_of_week) DO NOTHING;

INSERT INTO services (name, description, base_duration_minutes) VALUES
  ('Baño básico', 'Baño con shampoo neutro, secado y cepillado', 45),
  ('Peluquería completa', 'Baño, corte de pelo a tijera o máquina, y perfilado', 90),
  ('Desparasitación', 'Aplicación de producto antiparasitario externo', 20),
  ('Corte de uñas', 'Corte y limado de uñas', 15)
ON CONFLICT DO NOTHING;
