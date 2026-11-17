-- 1) Tamaño 'gigante' para mascotas (los servicios "perro gigante" no se podían reservar
--    porque pets.size solo admitía pequeño/mediano/grande).
--    Se eliminan los CHECK de pets que mencionan `size` buscándolos por definición (no por
--    nombre), por si en tu base se llaman distinto al nombre por defecto.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'pets'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%size%'
  LOOP
    EXECUTE format('ALTER TABLE pets DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE pets
  ADD CONSTRAINT pets_size_check CHECK (size IN ('pequeño', 'mediano', 'grande', 'gigante'));

-- 2) Bloqueos de disponibilidad coherentes: hora de inicio y fin van juntas.
--    Primero se corrigen filas existentes que romperían las reservas de ese día.
UPDATE availability_blocks SET end_time = '23:59'
  WHERE start_time IS NOT NULL AND end_time IS NULL;
UPDATE availability_blocks SET start_time = NULL, end_time = NULL
  WHERE start_time IS NULL AND end_time IS NOT NULL;

-- NOT VALID: se exige para filas nuevas/modificadas sin re-escanear las existentes.
ALTER TABLE availability_blocks DROP CONSTRAINT IF EXISTS availability_blocks_times_chk;
ALTER TABLE availability_blocks
  ADD CONSTRAINT availability_blocks_times_chk CHECK (
    (start_time IS NULL AND end_time IS NULL)
    OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  ) NOT VALID;
