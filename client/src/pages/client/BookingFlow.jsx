import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StepIndicator from '../../components/StepIndicator';
import PetCard from '../../components/PetCard';
import AddressInput from '../../components/AddressInput';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { formatPrice } from '../../utils/format';

const STEPS = ['Mascota', 'Servicio', 'Dirección y horario', 'Confirmación'];

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [phone, setPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const canContinue =
    step === 1
      ? Boolean(selectedPet)
      : step === 2
        ? Boolean(selectedService)
        : step === 3
          ? Boolean(location && selectedSlot && isValidPhone(phone))
          : false;

  useEffect(() => {
    api.get('/api/pets').then((data) => setPets(data.pets));
  }, []);

  useEffect(() => {
    if (!selectedPet) {
      setServices([]);
      setServicesLoading(false);
      return undefined;
    }

    let active = true;
    setServices([]);
    setServicesLoading(true);
    setServicesError(null);
    api.get(`/api/services?petId=${encodeURIComponent(selectedPet.id)}`)
      .then((data) => {
        if (active) setServices(data.services);
      })
      .catch((err) => {
        if (active) setServicesError(err.message || 'No se pudieron cargar los servicios.');
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPet?.id, selectedPet?.size, selectedPet?.species]);

  async function confirmBooking() {
    if (!location || !selectedSlot || !isValidPhone(phone)) {
      setBookingError('Debes ingresar un número de celular válido antes de agendar.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const { appointment } = await api.post('/api/appointments', {
        petId: selectedPet.id,
        serviceId: selectedService.id,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        date: selectedSlot.date,
        startTime: selectedSlot.time,
        clientPhone: phone,
      });

      setConfirmedAppointment(appointment);
    } catch (err) {
      setBookingError(err.message || 'No se pudo agendar la cita.');
    } finally {
      setIsBooking(false);
    }
  }

  const finalPrice = selectedService?.final_price_cop ?? selectedService?.price_cop ?? 0;

  if (confirmedAppointment) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="royal-panel">
            <h1 className="font-display text-3xl text-white">Cita confirmada</h1>
            <div className="mt-5 rounded-[24px] border border-[#D4AF37]/30 bg-[#0F0F0F] p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#E5C158]">Mascota</p>
              <p className="mt-2 font-display text-2xl text-white">{selectedPet.name}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Servicio</p>
              <p className="mt-2 text-lg text-[#F1E5C5]">{selectedService.name}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Celular</p>
              <p className="mt-2 text-lg text-[#F1E5C5]">{phone}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Precio</p>
              <p className="mt-2 text-lg font-semibold text-[#E5C158]">
                {formatPrice(Number(finalPrice))}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl">
        <StepIndicator currentStep={step} steps={STEPS} />

        {step === 1 && (
          <div className="mt-6 space-y-4">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                selected={selectedPet?.id === pet.id}
                onSelect={() => {
                  setSelectedPet(pet);
                  setSelectedService(null);
                  setSelectedSlot(null);
                }}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            {servicesError && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {servicesError}
              </p>
            )}
            {servicesLoading && (
              <p className="rounded-xl border border-[#D4AF37]/30 bg-[#111111] p-4 text-sm text-[#F1E5C5]">
                Cargando servicios...
              </p>
            )}
            {!servicesLoading && !servicesError && services.length === 0 && (
              <p className="rounded-xl border border-[#D4AF37]/30 bg-[#111111] p-4 text-sm text-[#F1E5C5]">
                No hay servicios disponibles para esta mascota.
              </p>
            )}
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setSelectedService(service);
                  setSelectedSlot(null);
                }}
                className={`w-full rounded-2xl border p-4 text-left ${
                  selectedService?.id === service.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-[#D4AF37]/30 bg-[#111111]'
                }`}
              >
                <p className="font-display text-xl text-white">{service.name}</p>
                <p className="mt-2 text-sm text-[#F1E5C5]">{service.description}</p>
                <p className="mt-2 text-[#E5C158]">
                  {formatPrice(service.final_price_cop ?? service.price_cop)}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-5">
            <AddressInput
              onConfirm={(nextLocation) => {
                setLocation(nextLocation);
                setSelectedSlot(null);
              }}
            />

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4">
              <label className="mb-2 block text-sm text-[#F1E5C5]">Número de celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="320 436 5478"
                autoComplete="tel"
                required
                className="w-full rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2.5 text-white outline-none placeholder:text-white/40"
              />
              {phone && !isValidPhone(phone) && (
                <p className="mt-2 text-sm text-red-300">
                  Ingresa un número válido (de 7 a 15 dígitos).
                </p>
              )}
              {!phone && (
                <p className="mt-2 text-sm text-[#F1E5C5]/70">
                  El número de celular es obligatorio para agendar.
                </p>
              )}
            </div>

            <AvailabilityCalendar
              petId={selectedPet?.id}
              serviceId={selectedService?.id}
              lat={location?.lat}
              lng={location?.lng}
              onSelectSlot={setSelectedSlot}
            />
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-5 text-[#F1E5C5]">
            <h2 className="font-display text-2xl text-white">Confirmación</h2>

            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Mascota:</strong> {selectedPet?.name}</p>
              <p><strong>Servicio:</strong> {selectedService?.name}</p>
              <p><strong>Dirección:</strong> {location?.address}</p>
              <p><strong>Fecha:</strong> {selectedSlot?.date}</p>
              <p><strong>Hora:</strong> {selectedSlot?.time}</p>
              <p><strong>Celular:</strong> {phone}</p>
              <p><strong>Precio:</strong> {formatPrice(Number(finalPrice))}</p>
            </div>

            {bookingError && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {bookingError}
              </div>
            )}

            <button
              type="button"
              onClick={confirmBooking}
              disabled={isBooking}
              className="mt-6 w-full rounded-full bg-[#D4AF37] px-4 py-3 font-semibold text-[#0F0F0F]"
            >
              {isBooking ? 'Agendando...' : 'Confirmar cita'}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            disabled={step === 1}
            className="rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Atrás
          </button>

          <button
            type="button"
            onClick={() => {
              setBookingError(null);
              setStep((prev) => Math.min(prev + 1, 4));
            }}
            disabled={!canContinue}
            className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F0F0F] disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}