// Muestra de forma inmediata y legible las alertas de comportamiento y salud de la mascota,
// tal como las vería el estilista antes de empezar el servicio.
export default function PetAlerts({ pet }) {
  const alerts = [];
  if (pet.is_reactive) alerts.push('Reactivo o nervioso — manejar con calma');
  if (pet.is_allergic) alerts.push(pet.allergy_notes ? `Alérgico: ${pet.allergy_notes}` : 'Alérgico a insumos');
  if (pet.is_geriatric) alerts.push('Paciente geriátrico');
  if (pet.medical_conditions) alerts.push(`Condición médica: ${pet.medical_conditions}`);

  if (alerts.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1">
      {alerts.map((text) => (
        <li key={text} className="flex items-start gap-1.5 rounded-md bg-clay-light px-2 py-1 text-xs text-clay">
          <span aria-hidden="true">⚠</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
