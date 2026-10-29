import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const WEEKDAY_LABEL = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function AvailabilityCalendar({ petId, serviceId, lat, lng, onSelectSlot }) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(formatDateKey(days[0]));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!petId || !serviceId || !lat || !lng || !selectedDate) return;

    setIsLoading(true);
    setError(null);
    setSelectedSlot(null);

    api
      .get(`/api/availability?date=${selectedDate}&serviceId=${serviceId}&petId=${petId}&lat=${lat}&lng=${lng}`)
      .then((data) => setSlots(data.slots))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [petId, serviceId, lat, lng, selectedDate]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => {
          const key = formatDateKey(d);
          const isSelected = key === selectedDate;

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className={`flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition ${
                isSelected
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0F0F0F] shadow-gold'
                  : 'border-[#D4AF37]/40 bg-[#111111] text-[#F1E5C5] hover:border-[#E5C158]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.12em]">{WEEKDAY_LABEL[d.getDay()]}</span>
              <span className="font-display text-lg">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {isLoading && <p className="text-sm text-[#F1E5C5]">Buscando horarios disponibles…</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {!isLoading && !error && slots.length === 0 && (
          <p className="text-sm text-[#F1E5C5]">
            No hay horarios disponibles este día. Elige otra fecha.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => {
                setSelectedSlot(slot);
                onSelectSlot?.({ date: selectedDate, time: slot });
              }}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                selectedSlot === slot
                  ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0F0F0F] shadow-gold'
                  : 'border-[#D4AF37]/40 bg-[#0F0F0F] text-[#F1E5C5] hover:border-[#E5C158]'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}