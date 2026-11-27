-- Datos iniciales de ejemplo (ajuste, horarios y catálogo de servicios).
-- `npm run migrate` solo los carga cuando la base está VACÍA (tabla services sin filas), para no
-- volver a insertar servicios de ejemplo en una base que ya tiene su catálogo real.
-- Edita estos valores si quieres que una base nueva arranque con tu catálogo y horarios.

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

INSERT INTO services (name, description, base_duration_minutes, price_cop, active) VALUES
  ('Baño perro pequeño', 'Baño completo para perro pequeño. Desde $70.000 COP.', 45, 70000, true),
  ('Baño y corte perro pequeño', 'Baño + corte para perro pequeño. Desde $80.000 COP.', 75, 80000, true),
  ('Baño perro mediano', 'Baño completo para perro mediano. Desde $75.000 COP.', 60, 75000, true),
  ('Baño y corte perro mediano', 'Baño + corte para perro mediano. Desde $95.000 COP.', 90, 95000, true),
  ('Baño perro grande', 'Baño completo para perro grande. Desde $100.000 COP.', 75, 100000, true),
  ('Baño y corte perro grande', 'Baño + corte para perro grande. Desde $120.000 COP.', 105, 120000, true),
  ('Baño perro gigante', 'Baño completo para perro gigante. Desde $120.000 COP.', 90, 120000, true),
  ('Baño y corte perro gigante', 'Baño + corte para perro gigante. Desde $150.000 COP.', 120, 150000, true),
  ('Deslanado', 'Deslanado según tamaño y densidad del pelaje. Rango aprox: $20.000 a $40.000 COP.', 30, 20000, true),
  ('Deslanado premium', 'Deslanado más intenso según tamaño y pelaje. Rango aprox: $40.000 a $80.000 COP.', 45, 40000, true),
  ('Baño gato pelo corto', 'Baño para gato de pelo corto. Desde $70.000 COP.', 40, 70000, true),
  ('Baño gato pelo largo', 'Baño para gato de pelo largo. Desde $75.000 COP.', 50, 75000, true),
  ('Baño y corte gato', 'Baño + corte para gato. Desde $95.000 COP.', 80, 95000, true),
  ('Baño medicado', 'Baño medicado con suplemento según tamaño. Desde $15.000 a $25.000 COP adicionales.', 60, 15000, true),
  ('Corte de uñas', 'Corte y limado de uñas. Desde $20.000 COP.', 15, 20000, true),
  ('Limpieza de oídos', 'Limpieza de oídos. Desde $25.000 COP.', 15, 25000, true),
  ('Cepillado dental', 'Cepillado dental. Desde $40.000 COP.', 20, 40000, true),
  ('Profilaxis', 'Profilaxis dental. Desde $220.000 COP.', 60, 220000, true)
ON CONFLICT (name) DO NOTHING;
