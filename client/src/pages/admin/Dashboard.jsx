import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [frequentCustomers, setFrequentCustomers] = useState(0);
  const [automaticDiscounts, setAutomaticDiscounts] = useState(0);

  function load() {
    api.get(`/api/admin/appointments?date=${date}`).then((data) => setAppointments(data.appointments));
  }

  useEffect(load, [date]);

  useEffect(() => {
    async function loadSummary() {
      const dateObj = new Date();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();

      const result = await api.get(`/api/admin/settings`);
      const settings = result.settings || [];

      const discountSetting = settings.find((s) => s.key === 'automatic_discount');
      setAutomaticDiscounts(discountSetting ? Number(discountSetting.value || 0) : 0);

      const appts = await api.get(`/api/admin/appointments?date=${year}-${month}-01`);
      const list = appts.appointments || [];
      const income = list.reduce((sum, a) => sum + Number(a.final_price_cop || a.price_cop || 0), 0);

      const uniqueClients = new Set(list.map((a) => a.client_id)).size;
      setMonthlyIncome(income);
      setFrequentCustomers(uniqueClients);
    }

    loadSummary();
  }, []);

  async function updateStatus(id, status) {
    const res = await api.patch(`/api/admin/appointments/${id}`, { status });
    if (status === 'done' && res.whatsapp_link) {
      window.open(res.whatsapp_link, '_blank');
    }
    load();
  }

  async function saveNotes(id, stylistNotes) {
    await api.patch(`/api/admin/appointments/${id}`, { stylistNotes });
    load();
  }

  async function markDone(id) {
    const res = await api.patch(`/api/admin/appointments/${id}`, { status: 'done' });
    if (res.whatsapp_link) {
      window.open(res.whatsapp_link, '_blank');
    }
    load();
  }

  async function sendPickupReminder(id) {
    const res = await api.post(`/api/admin/appointments/${id}/send-pickup-reminder`);
    if (res.whatsapp_link) {
      window.open(res.whatsapp_link, '_blank');
    }
    load();
  }

  const monthLabel = useMemo(() => {
    const dateObj = new Date(`${date}T00:00:00`);
    return dateObj.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }, [date]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-2 py-4 text-white">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Ingresos del mes</p>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {currencyFormatter.format(monthlyIncome)}
          </h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {monthlyIncome === 0
              ? `Aún no hay ingresos registrados en ${monthLabel}.`
              : 'Ingreso real del mes actual.'}
          </p>
        </div>

        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Clientes frecuentes</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{frequentCustomers}</h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {frequentCustomers === 0
              ? 'Aún no hay clientes frecuentes.'
              : 'Clientes con retención activa.'}
          </p>
        </div>

        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Descuentos automáticos</p>
          <h2 className="mt-3 text-4xl font-bold text-white">{automaticDiscounts}%</h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {automaticDiscounts === 0
              ? 'Sin descuentos activos aún.'
              : 'Activados para clientes VIP'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#D4AF37]/30 bg-[#111111]/90 p-4 shadow-gold backdrop-blur-md">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Panel administrativo</p>
          <h1 className="mt-1 font-display text-3xl text-white">Agenda del día</h1>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-2.5 text-sm text-white outline-none focus:border-[#E5C158]"
        />
      </div>

      <div className="mt-6 space-y-4">
        {appointments.map((a, index) => (
          <div key={a.id || index} className="rounded-[24px] border border-[#D4AF37]/30 bg-[#111111] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Mascota</p>
                <h3 className="mt-1 font-display text-2xl text-white">{a.pet_name}</h3>
                <p className="mt-1 text-sm text-[#F1E5C5]">
                  {a.client_name || 'Cliente'} · {a.service_name}
                </p>
                <p className="mt-1 text-sm text-[#F1E5C5]">
                  {a.appointment_date} · {a.start_time} - {a.end_time}
                </p>
                <p className="mt-2 text-sm text-[#F1E5C5]">
                  Teléfono: {a.client_phone || a.phone || 'Sin número'}
                </p>
                <p className="mt-2 text-sm text-[#F1E5C5]">
                  Dirección: {a.address}
                </p>
                <p className="mt-2 text-sm text-[#E5C158] font-semibold">
                  Precio: {currencyFormatter.format(Number(a.final_price_cop || a.price_cop || 0))}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value)}
                  className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="done">Terminado</option>
                  <option value="cancelled">Cancelada</option>
                </select>

                <button
                  type="button"
                  onClick={() => markDone(a.id)}
                  className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Marcar terminado
                </button>

                <button
                  type="button"
                  onClick={() => sendPickupReminder(a.id)}
                  className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Recordatorio de recogida
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                Nota del estilista
              </label>

              <textarea
                defaultValue={a.stylist_notes || ''}
                onBlur={(e) => saveNotes(a.id, e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-[#D4AF37]/30 bg-[#111111] px-3 py-2 text-sm text-white outline-none"
                placeholder="Escribe una nota para esta cita..."
              />
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#D4AF37]/30 bg-[#111111] p-8 text-center text-[#F1E5C5]">
            No hay citas para esta fecha.
          </div>
        )}
      </div>
    </div>
  );
}