-- 1) Archivado de mascotas: en lugar de borrar la mascota (y, en cascada, todas sus citas,
--    reseñas y recordatorios), las que ya tienen historial se marcan con deleted_at.
ALTER TABLE pets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2) Red de seguridad: ya no se puede borrar una mascota que tenga citas (sin ON DELETE
--    CASCADE el borrado falla con error 23503). Se eliminan TODAS las llaves foráneas de
--    appointments hacia pets buscándolas por definición (no por nombre), para asegurar que
--    no quede ninguna con CASCADE, y se crea una sola con el comportamiento por defecto
--    (NO ACTION, evaluado al final de la sentencia) para no impedir que, si algún día se
--    elimina un usuario, sus mascotas y citas se borren juntas por sus propias cascadas.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'appointments'::regclass
      AND contype = 'f'
      AND confrelid = 'pets'::regclass
  LOOP
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES pets(id);
