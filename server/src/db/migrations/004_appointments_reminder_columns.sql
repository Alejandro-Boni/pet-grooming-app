-- Columnas de estado de recordatorios en appointments. Tu base de Neon ya las tiene; esta
-- migración solo las agrega donde falten (bases locales o nuevas). Es idempotente y segura
-- de correr sobre producción: si las columnas existen, no hace nada.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pickup_reminder_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pickup_reminder_sent_at TIMESTAMPTZ;
