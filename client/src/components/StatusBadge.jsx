const STATUS_CONFIG = {
  pending: { label: 'Pendiente', className: 'bg-ochre/15 text-ochre-dark' },
  in_progress: { label: 'En proceso', className: 'bg-pine/10 text-pine' },
  done: { label: 'Finalizada', className: 'bg-sage/25 text-ink/70' },
  cancelled: { label: 'Cancelada', className: 'bg-clay-light text-clay' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
