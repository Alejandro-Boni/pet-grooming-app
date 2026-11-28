import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { formatTime } from '../../utils/format';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function getNavigationUrls(appointment) {
  const hasCoordinates = appointment.lat != null && appointment.lng != null;
  const destination = hasCoordinates
    ? `${appointment.lat},${appointment.lng}`
    : appointment.address;

  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`,
    waze: hasCoordinates
      ? `https://waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`,
  };
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    in_progress: 'En curso',
    done: 'Terminada',
    cancelled: 'Cancelada',
  };
  return labels[status] || status || 'Sin estado';
}

function formatAppointmentDate(date) {
  const dateKey = String(date).slice(0, 10);
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('es-CO');
}

function formatBogotaDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function Dashboard() {
  const [date, setDate] = useState(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  );
  const [appointments, setAppointments] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [automaticDiscounts, setAutomaticDiscounts] = useState(0);
  const [incomeMonth, setIncomeMonth] = useState(() =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })
      .format(new Date())
      .slice(0, 7)
  );
  const [monthlyAppointments, setMonthlyAppointments] = useState([]);
  const [isLoadingIncome, setIsLoadingIncome] = useState(true);
  const [isMonthlyReportLoaded, setIsMonthlyReportLoaded] = useState(false);
  const [incomeError, setIncomeError] = useState('');
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [incomeReportRefresh, setIncomeReportRefresh] = useState(0);
  const [pickupActionId, setPickupActionId] = useState(null);
  const [pickupErrors, setPickupErrors] = useState({});
  const [pickupLinks, setPickupLinks] = useState({});
  const [pickupMessages, setPickupMessages] = useState({});

  function load() {
    api
      .get(`/api/admin/appointments?date=${date}`)
      .then((data) => setAppointments(data.appointments));
  }

  useEffect(load, [date]);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setIsLoadingIncome(true);
      setIsMonthlyReportLoaded(false);
      setMonthlyAppointments([]);
      setMonthlyIncome(0);
      setIncomeError('');
      try {
        const [settingsResult, report] = await Promise.all([
          api.get('/api/admin/settings'),
          api.get(`/api/admin/reports/monthly-income?month=${encodeURIComponent(incomeMonth)}`),
        ]);
        if (!active) return;

        const settings = settingsResult.settings || [];
        const discountSetting = settings.find(
          (setting) => setting.key === 'automatic_discount'
        );
        const list = report.appointments || [];

        setAutomaticDiscounts(
          discountSetting ? Number(discountSetting.value || 0) : 0
        );
        setMonthlyAppointments(list);
        setMonthlyIncome(Number(report.total_income || 0));
        setIsMonthlyReportLoaded(true);
      } catch (err) {
        if (active) {
          setIncomeError(err.message || 'No se pudo cargar el reporte mensual.');
        }
      } finally {
        if (active) setIsLoadingIncome(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [incomeMonth, incomeReportRefresh]);

  async function downloadMonthlyIncomeReport() {
    setIsDownloadingReport(true);
    setIncomeError('');

    try {
      const monthDate = new Date(`${incomeMonth}-01T12:00:00`);
      const reportMonthLabel = monthDate.toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric',
      });
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, 297, 38, 'F');
      doc.setTextColor(229, 193, 88);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('MASCOTA REY', 14, 17);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Reporte de ingresos · ${reportMonthLabel}`, 14, 27);

      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Total del mes: ${currencyFormatter.format(monthlyIncome)}`, 14, 49);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Citas terminadas: ${monthlyAppointments.length}`, 14, 56);
      doc.text('Incluye recargos registrados; no registra pagos recibidos.', 14, 61);

      autoTable(doc, {
        startY: 68,
        head: [[
          'Fecha',
          'Hora',
          'Cliente',
          'Mascota',
          'Servicio',
          'Estado',
          'Servicio',
          'Recargo',
          'Total',
        ]],
        body: monthlyAppointments.map((appointment) => [
          formatAppointmentDate(appointment.appointment_date),
          formatTime(appointment.start_time),
          appointment.client_name || 'Cliente',
          appointment.pet_name || '',
          appointment.service_name || '',
          getStatusLabel(appointment.status),
          currencyFormatter.format(Number(appointment.service_price_cop || 0)),
          currencyFormatter.format(Number(appointment.late_pickup_fee_cop || 0)),
          currencyFormatter.format(Number(appointment.amount_cop || 0)),
        ]),
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [212, 175, 55],
          textColor: [15, 15, 15],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 246, 239] },
        margin: { left: 14, right: 14 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Mascota Rey · Página ${page} de ${pageCount}`, 283, 203, {
          align: 'right',
        });
      }

      doc.save(`reporte-ingresos-${incomeMonth}.pdf`);
    } catch (err) {
      setIncomeError(err.message || 'No se pudo generar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsDownloadingReport(false);
    }
  }

  async function updateStatus(id, status) {
    const res = await api.patch(`/api/admin/appointments/${id}`, { status });

    if (status === 'done' && res.whatsapp_link) {
      window.open(res.whatsapp_link, '_blank', 'noopener,noreferrer');
    }

    load();
    setIncomeReportRefresh((refresh) => refresh + 1);
  }

  async function saveNotes(id, stylistNotes) {
    await api.patch(`/api/admin/appointments/${id}`, { stylistNotes });
    load();
  }

  async function markDone(id) {
    const res = await api.patch(`/api/admin/appointments/${id}`, {
      status: 'done',
    });

    if (res.whatsapp_link) {
      window.open(res.whatsapp_link, '_blank', 'noopener,noreferrer');
    }

    load();
    setIncomeReportRefresh((refresh) => refresh + 1);
  }

  async function recordPickup(id) {
    setPickupActionId(id);
    setPickupErrors((errors) => ({ ...errors, [id]: '' }));
    setPickupLinks((links) => ({ ...links, [id]: '' }));

    try {
      const result = await api.post(
        `/api/admin/appointments/${id}/record-pickup`,
        {}
      );
      load();
      setIncomeReportRefresh((refresh) => refresh + 1);
      if (result.whatsapp_link) {
        setPickupLinks((links) => ({ ...links, [id]: result.whatsapp_link }));
      }
      if (result.message) {
        setPickupMessages((messages) => ({ ...messages, [id]: result.message }));
      }
    } catch (err) {
      setPickupErrors((errors) => ({
        ...errors,
        [id]: err.message || 'No se pudo registrar la recogida.',
      }));
    } finally {
      setPickupActionId(null);
    }
  }

  const monthLabel = useMemo(() => {
    const dateObj = new Date(`${incomeMonth}-01T12:00:00`);
    return dateObj.toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    });
  }, [incomeMonth]);

  const frequentCustomerNames = useMemo(() => {
    const customers = new Map();
    monthlyAppointments.forEach((appointment) => {
      if (!customers.has(appointment.client_id)) {
        customers.set(appointment.client_id, {
          id: appointment.client_id,
          name: appointment.client_name || 'Cliente',
        });
      }
    });
    return [...customers.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'es')
    );
  }, [monthlyAppointments]);
  const frequentCustomers = frequentCustomerNames.length;

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-2 py-4 text-white">
      <div className="bento-grid mb-6">
        <div className="bento-card md:col-span-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
            Ingresos del mes
          </p>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {currencyFormatter.format(monthlyIncome)}
          </h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {isLoadingIncome
              ? 'Cargando reporte mensual...'
              : monthlyAppointments.length === 0
                ? `Aún no hay citas terminadas en ${monthLabel}.`
                : 'Suma de citas terminadas y recargos registrados; no registra pagos recibidos.'}
          </p>
          <label className="mt-4 block text-xs text-[#F1E5C5]">
            Mes del reporte
            <input
              type="month"
              value={incomeMonth}
              onChange={(event) => {
                if (event.target.value) {
                  setIsLoadingIncome(true);
                  setIsMonthlyReportLoaded(false);
                  setIncomeError('');
                  setIncomeMonth(event.target.value);
                }
              }}
              className="mt-1 block rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white outline-none focus:border-[#E5C158]"
            />
          </label>
          <button
            type="button"
            onClick={downloadMonthlyIncomeReport}
            disabled={isLoadingIncome || isDownloadingReport || !isMonthlyReportLoaded}
            className="gold-button mt-4 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloadingReport ? 'Generando PDF...' : 'Descargar reporte PDF'}
          </button>
          {incomeError && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {incomeError}
            </p>
          )}
        </div>

        <div className="bento-card md:col-span-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
            Clientes frecuentes
          </p>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {frequentCustomers}
          </h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {incomeError
              ? 'No se pudieron cargar los clientes.'
              : isLoadingIncome
                ? 'Cargando clientes del mes...'
                : frequentCustomers === 0
                  ? `Aún no hay clientes con citas terminadas en ${monthLabel}.`
                  : `Clientes con citas terminadas en ${monthLabel}.`}
          </p>
          {frequentCustomerNames.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-white">
              {frequentCustomerNames.map((name) => (
                <li key={name.id}>{name.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="bento-card md:col-span-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
            Descuentos automáticos
          </p>
          <h2 className="mt-3 text-4xl font-bold text-white">
            {automaticDiscounts}%
          </h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">
            {automaticDiscounts === 0
              ? 'Sin descuentos activos aún.'
              : 'Activados para clientes VIP'}
          </p>
        </div>
      </div>

      <div className="bento-card mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
            Panel administrativo
          </p>
          <h1 className="mt-1 font-display text-3xl text-white">
            Agenda del día
          </h1>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-2.5 text-sm text-white outline-none focus:border-[#E5C158]"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {appointments.map((appointment, index) => {
          const nav = getNavigationUrls(appointment);

          return (
            <div
              key={appointment.id || index}
              className="bento-card-hover"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                    Mascota
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    {appointment.pet_name}
                  </h3>
                  <p className="mt-1 text-sm text-[#F1E5C5]">
                    {appointment.client_name || 'Cliente'} ·{' '}
                    {appointment.service_name}
                  </p>
                  <p className="mt-1 text-sm text-[#F1E5C5]">
                    {appointment.appointment_date} · {formatTime(appointment.start_time)} -{' '}
                    {formatTime(appointment.end_time)}
                  </p>
                  <p className="mt-2 text-sm text-[#F1E5C5]">
                    Teléfono:{' '}
                    {appointment.client_phone || appointment.phone || 'Sin número'}
                  </p>

                  <div className="mt-2 text-sm text-[#F1E5C5]">
                    <p>Dirección: {appointment.address}</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={nav.googleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F0F0F] transition hover:brightness-110"
                      >
                        <span aria-hidden="true">📍</span>
                        Ver ruta
                      </a>

                      <a
                        href={nav.waze}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#F1E5C5] transition hover:border-[#E5C158] hover:text-[#E5C158]"
                      >
                        Abrir en Waze
                      </a>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#E5C158]">
                    Precio:{' '}
                    {currencyFormatter.format(
                      Number(
                        appointment.final_price_cop ||
                          appointment.service_price_cop ||
                          appointment.price_cop ||
                          0
                      )
                    )}
                  </p>

                  {appointment.status === 'done' && (
                    <div className="mt-4 rounded-[18px] border border-[#D4AF37]/30 bg-[#0F0F0F] p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                        Recogida de mascota
                      </p>
                      {appointment.service_finished_at ? (
                        <p className="mt-2 text-sm text-[#F1E5C5]">
                          Conteo desde {formatBogotaDateTime(appointment.service_finished_at)}.
                          Hay 15 minutos de cortesía; luego se cobran $5.000 COP por cada
                          bloque iniciado de 15 minutos.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-[#F1E5C5]">
                          No hay hora de aviso guardada. Usa “Marcar terminado y avisar”
                          para iniciar el conteo; no se aplican recargos retroactivos.
                        </p>
                      )}

                      {appointment.picked_up_at ? (
                        <div className="mt-3 space-y-1 text-sm text-[#F1E5C5]">
                          <p>Recogida: {formatBogotaDateTime(appointment.picked_up_at)}</p>
                          <p>
                            Recargo por demora:{' '}
                            <strong className="text-[#E5C158]">
                              {currencyFormatter.format(
                                Number(appointment.late_pickup_fee_cop || 0)
                              )}
                            </strong>
                          </p>
                          <p>
                            Total del servicio:{' '}
                            <strong className="text-white">
                              {currencyFormatter.format(
                                Number(
                                  appointment.final_price_cop ||
                                    appointment.service_price_cop ||
                                    appointment.price_cop ||
                                    0
                                ) + Number(appointment.late_pickup_fee_cop || 0)
                              )}
                            </strong>
                          </p>
                          {pickupMessages[appointment.id] && (
                            <p className="mt-2 break-words rounded-xl border border-[#D4AF37]/20 bg-[#111111] p-3 text-xs">
                              {pickupMessages[appointment.id]}
                            </p>
                          )}
                          {pickupLinks[appointment.id] && (
                            <a
                              href={pickupLinks[appointment.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex rounded-full border border-[#D4AF37]/60 px-4 py-2 text-sm font-medium text-[#E5C158] transition hover:border-[#E5C158]"
                            >
                              Abrir WhatsApp con el aviso del recargo
                            </a>
                          )}
                        </div>
                      ) : appointment.service_finished_at ? (
                        <button
                          type="button"
                          onClick={() => recordPickup(appointment.id)}
                          disabled={pickupActionId === appointment.id}
                          className="gold-button mt-3 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pickupActionId === appointment.id
                            ? 'Registrando recogida...'
                            : 'Registrar recogida'}
                        </button>
                      ) : null}
                      {pickupErrors[appointment.id] && (
                        <p role="alert" className="mt-2 text-sm text-red-300">
                          {pickupErrors[appointment.id]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={appointment.status}
                    onChange={(e) =>
                      updateStatus(appointment.id, e.target.value)
                    }
                    className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2 text-sm text-white"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En curso</option>
                    <option value="done">Terminado</option>
                    <option value="cancelled">Cancelada</option>
                  </select>

                  {(appointment.status !== 'done' ||
                    !appointment.service_finished_at) && (
                    <button
                      type="button"
                      onClick={() => markDone(appointment.id)}
                      className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
                    >
                      Marcar terminado y avisar
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                  Nota del estilista
                </label>

                <textarea
                  defaultValue={appointment.stylist_notes || ''}
                  onBlur={(e) => saveNotes(appointment.id, e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#D4AF37]/30 bg-[#111111] px-3 py-2 text-sm text-white outline-none"
                  placeholder="Escribe una nota para esta cita..."
                />
              </div>
            </div>
          );
        })}

        {appointments.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#D4AF37]/30 bg-[#111111] p-8 text-center text-[#F1E5C5]">
            No hay citas para esta fecha.
          </div>
        )}
      </div>
    </div>
  );
}