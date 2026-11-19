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
  size TEXT NOT NULL CHECK (size IN ('pequeño', 'mediano', 'grande', 'gigante')),
  is_reactive BOOLEAN NOT NULL DEFAULT false,
  is_allergic BOOLEAN NOT NULL DEFAULT false,
  allergy_notes TEXT,
  is_geriatric BOOLEAN NOT NULL DEFAULT false,
  medical_conditions TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_duration_minutes INTEGER NOT NULL,
  price_cop INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS business_hours (
  day_of_week INTEGER PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME
);

CREATE TABLE IF NOT EXISTS availability_blocks (
  id SERIAL PRIMARY KEY,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  address TEXT NOT NULL,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  stylist_notes TEXT,
  final_price_cop INTEGER NOT NULL DEFAULT 0,
  service_finished_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  late_pickup_fee_cop INTEGER NOT NULL DEFAULT 0,
  client_phone VARCHAR(20),
  reminder_status TEXT NOT NULL DEFAULT 'pending',
  reminder_sent_at TIMESTAMPTZ,
  pickup_reminder_status TEXT NOT NULL DEFAULT 'pending',
  pickup_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS client_phone TEXT;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('service_finished', 'pickup_ready')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  phone VARCHAR(20),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment ON appointment_reminders (appointment_id);
CREATE UNIQUE INDEX IF NOT EXISTS services_name_unique_idx ON services (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets (owner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_visible_created ON reviews (is_visible, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews (customer_id);
