-- Tabla usada por admin.js (rutas PATCH /appointments/:id y /send-pickup-reminder).
-- Es segura de correr varias veces. Ejecútala en el editor SQL de Neon si no quieres
-- correr `npm run migrate` completo contra producción.
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON appointment_reminders (appointment_id);
