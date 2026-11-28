CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id),
  position INTEGER NOT NULL CHECK (position > 0),
  service_price_cop INTEGER NOT NULL CHECK (service_price_cop >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  PRIMARY KEY (appointment_id, service_id),
  UNIQUE (appointment_id, position)
);

INSERT INTO appointment_services (
  appointment_id,
  service_id,
  position,
  service_price_cop,
  duration_minutes
)
SELECT a.id,
       a.service_id,
       1,
       GREATEST(COALESCE(NULLIF(a.final_price_cop, 0), s.price_cop, 0), 0),
       GREATEST(EXTRACT(EPOCH FROM (a.end_time - a.start_time))::integer / 60, 1)
FROM appointments a
JOIN services s ON s.id = a.service_id
ON CONFLICT (appointment_id, service_id) DO NOTHING;
