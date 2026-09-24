import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Availability() {
  const [blackouts, setBlackouts] = useState([]);
  const [maxConcurrent, setMaxConcurrent] = useState('');
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', reason: '' });

  function load() {
    api.get('/api/admin/blackouts').then((data) => setBlackouts(data.blackouts));
    api.get('/api/admin/settings').then((data) => {
      const setting = data.settings.find((s) => s.key === 'max_concurrent_pets');
      setMaxConcurrent(setting?.value || '1');
    });
  }

  useEffect(load, []);

  async function addBlackout(e) {
    e.preventDefault();
    await api.post('/api/admin/blackouts', form);
    setForm({ date: '', startTime: '', endTime: '', reason: '' });
    load();
  }

  async function removeBlackout(id) {
    await api.del(`/api/admin/blackouts/${id}`);
    load();
  }

  async function saveMaxConcurrent() {
    await api.put('/api/admin/settings/max_concurrent_pets', { value: maxConcurrent });
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl text-ink">Disponibilidad</h1>

      <section className="mt-6 rounded-xl border border-sage/50 bg-cream p-4">
        <h2 className="font-display text-lg text-ink">Cupo máximo de mascotas simultáneas</h2>
        <p className="mt-1 text-sm text-ink/60">
          Cuántas mascotas pueden atenderse al mismo tiempo en el local.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(e.target.value)}
            className="w-24 rounded-lg border border-sage/60 bg-linen px-3 py-2 text-ink"
          />
          <button onClick={saveMaxConcurrent} className="rounded-full bg-pine px-4 py-2 text-sm text-cream">
            Guardar
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-sage/50 bg-cream p-4">
        <h2 className="font-display text-lg text-ink">Bloquear días u horas</h2>
        <p className="mt-1 text-sm text-ink/60">Deja las horas vacías para bloquear el día completo (ej. festivos).</p>
        <form onSubmit={addBlackout} className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="date" required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="col-span-2 rounded-lg border border-sage/60 bg-linen px-3 py-2 text-sm text-ink sm:col-span-1"
          />
          <input
            type="text"
            placeholder="Motivo (ej. Feriado)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="col-span-2 rounded-lg border border-sage/60 bg-linen px-3 py-2 text-sm text-ink sm:col-span-1"
          />
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="rounded-lg border border-sage/60 bg-linen px-3 py-2 text-sm text-ink"
            placeholder="Desde"
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="rounded-lg border border-sage/60 bg-linen px-3 py-2 text-sm text-ink"
            placeholder="Hasta"
          />
          <button type="submit" className="col-span-2 rounded-full bg-ochre py-2 text-sm font-medium text-cream">
            Añadir bloqueo
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg text-ink">Bloqueos activos</h2>
        <div className="mt-3 space-y-2">
          {blackouts.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-sage/50 bg-cream px-3 py-2 text-sm">
              <span>
                {b.block_date} {b.start_time ? `· ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}` : '· día completo'}
                {b.reason ? ` · ${b.reason}` : ''}
              </span>
              <button onClick={() => removeBlackout(b.id)} className="text-clay underline underline-offset-2">
                Quitar
              </button>
            </div>
          ))}
          {blackouts.length === 0 && <p className="text-sm text-ink/50">No hay bloqueos programados.</p>}
        </div>
      </section>
    </div>
  );
}
