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
      <h1 className="font-display text-2xl text-white">Disponibilidad</h1>

      <section className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 shadow-gold">
        <h2 className="font-display text-lg text-[#F7F1E3]">
          Cupo máximo de mascotas simultáneas
        </h2>

        <p className="mt-1 text-sm text-[#F1E5C5]">
          Cuántas mascotas pueden atenderse al mismo tiempo en el local.
        </p>

        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(e.target.value)}
            className="w-24 rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-base text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
          />

          <button
            onClick={saveMaxConcurrent}
            className="rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] px-4 py-2 text-sm font-semibold text-[#0F0F0F] shadow-gold"
          >
            Guardar
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 shadow-gold">
        <h2 className="font-display text-lg text-[#F7F1E3]">Bloquear días u horas</h2>

        <p className="mt-1 text-sm text-[#F1E5C5]">
          Deja las horas vacías para bloquear el día completo (ej. festivos).
        </p>

        <form onSubmit={addBlackout} className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="col-span-2 rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#E5C158] focus:outline-none sm:col-span-1"
          />

          <input
            type="text"
            placeholder="Motivo (ej. Feriado)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="col-span-2 rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none sm:col-span-1"
          />

          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#E5C158] focus:outline-none"
          />

          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#E5C158] focus:outline-none"
          />

          <button
            type="submit"
            className="col-span-2 rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] py-2 text-sm font-semibold text-[#0F0F0F] shadow-gold"
          >
            Añadir bloqueo
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg text-white">Bloqueos activos</h2>

        <div className="mt-3 space-y-2">
          {blackouts.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-[#D4AF37]/30 bg-[#111111] px-3 py-2 text-sm text-[#F1E5C5]"
            >
              <span>
                {b.block_date}{' '}
                {b.start_time
                  ? `· ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}`
                  : '· día completo'}
                {b.reason ? ` · ${b.reason}` : ''}
              </span>

              <button
                onClick={() => removeBlackout(b.id)}
                className="text-[#E5C158] underline underline-offset-2"
              >
                Quitar
              </button>
            </div>
          ))}

          {blackouts.length === 0 && (
            <p className="text-sm text-[#F1E5C5]">No hay bloqueos programados.</p>
          )}
        </div>
      </section>
    </div>
  );
}