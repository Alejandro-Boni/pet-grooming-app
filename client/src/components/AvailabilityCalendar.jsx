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
              className={`flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 ${
                isSelected ? 'border-ochre bg-ochre text-cream' : 'border-sage/50 bg-cream text-ink'
              }`}
            >
              <span className="text-xs uppercase">{WEEKDAY_LABEL[d.getDay()]}</span>
              <span className="font-display text-lg">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {isLoading && <p className="text-sm text-ink/50">Buscando horarios disponibles…</p>}
        {error && <p className="text-sm text-clay">{error}</p>}
        {!isLoading && !error && slots.length === 0 && (
          <p className="text-sm text-ink/50">No hay horarios disponibles este día. Elige otra fecha.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => {
                setSelectedSlot(slot);
                onSelectSlot?.({ date: selectedDate, time: slot });
              }}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                selectedSlot === slot ? 'border-pine bg-pine text-cream' : 'border-sage/60 bg-cream text-ink'
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
