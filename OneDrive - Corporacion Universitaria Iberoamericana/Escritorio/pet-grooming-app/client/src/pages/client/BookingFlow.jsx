import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import StepIndicator from '../../components/StepIndicator';
import PetCard from '../../components/PetCard';
import AddressInput from '../../components/AddressInput';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { formatPrice, formatDate, formatTime } from '../../utils/format';

const STEPS = ['Mascota', 'Servicio', 'Dirección y horario', 'Confirmación'];

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [petsError, setPetsError] = useState(null);
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
  const [showTerms, setShowTerms] = useState(false);
  const [termsViewed, setTermsViewed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const canContinue =
    step === 1
      ? Boolean(selectedPet)
      : step === 2
        ? Boolean(selectedService)
        : step === 3
          ? Boolean(location && selectedSlot && isValidPhone(phone))
          : false;

  useEffect(() => {
    api
      .get('/api/pets')
      .then((data) => setPets(data.pets))
      .catch((err) => setPetsError(err.message || 'No se pudieron cargar tus mascotas.'));
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
    if (!termsAccepted) {
      setBookingError('Debes leer y aceptar los términos y condiciones antes de agendar.');
      return;
    }

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

  function resetBooking() {
    setStep(1);
    setSelectedPet(null);
    setSelectedService(null);
    setLocation(null);
    setSelectedSlot(null);
    setPhone('');
    setBookingError(null);
    setConfirmedAppointment(null);
    setShowTerms(false);
    setTermsViewed(false);
    setTermsAccepted(false);
  }

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

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Fecha y hora</p>
              <p className="mt-2 text-lg capitalize text-[#F1E5C5]">
                {formatDate(confirmedAppointment.appointment_date || selectedSlot?.date)}
                {' · '}
                {formatTime(confirmedAppointment.start_time || selectedSlot?.time)}
                {confirmedAppointment.end_time ? ` – ${formatTime(confirmedAppointment.end_time)}` : ''}
              </p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Dirección</p>
              <p className="mt-2 text-lg text-[#F1E5C5]">{confirmedAppointment.address || location?.address}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Celular</p>
              <p className="mt-2 text-lg text-[#F1E5C5]">{phone}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Precio</p>
              <p className="mt-2 text-lg font-semibold text-[#E5C158]">
                {formatPrice(Number(finalPrice))}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/app/citas"
                className="rounded-full bg-[#D4AF37] px-4 py-3 text-center font-semibold text-[#0F0F0F]"
              >
                Ver mis citas
              </Link>
              <button
                type="button"
                onClick={resetBooking}
                className="rounded-full border border-[#D4AF37]/40 px-4 py-3 text-center text-white"
              >
                Agendar otra cita
              </button>
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
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {petsError && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {petsError}
              </p>
            )}
            {pets.map((pet, index) => (
              <PetCard
                key={pet.id}
                pet={pet}
                selected={selectedPet?.id === pet.id}
                revealDelay={index * 70}
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
          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
            {services.map((service, index) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setSelectedService(service);
                  setSelectedSlot(null);
                }}
                className={`bento-reveal-item w-full rounded-2xl border p-4 text-left ${
                  selectedService?.id === service.id
                    ? 'border-[#E5C158] bg-[#D4AF37]/10 shadow-gold'
                    : 'border-[#D4AF37]/30 bg-[#111111] shadow-gold'
                }`}
                style={{ '--reveal-delay': `${index * 70}ms` }}
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
            <div className="bento-reveal-item" style={{ '--reveal-delay': '0ms' }}>
              <AddressInput
                onConfirm={(nextLocation) => {
                  setLocation(nextLocation);
                  setSelectedSlot(null);
                }}
              />
            </div>

            <div
              className="bento-reveal-item rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 text-[#F1E5C5] shadow-gold"
              style={{ '--reveal-delay': '70ms' }}
            >
              <label className="mb-2 block text-sm text-[#E5C158]">Número de celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="320 436 5478"
                autoComplete="tel"
                required
                className="w-full rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2.5 text-white outline-none placeholder:text-[#F1E5C5]/50 focus:border-[#E5C158]"
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

            <div className="bento-reveal-item" style={{ '--reveal-delay': '140ms' }}>
              <AvailabilityCalendar
                petId={selectedPet?.id}
                serviceId={selectedService?.id}
                lat={location?.lat}
                lng={location?.lng}
                onSelectSlot={setSelectedSlot}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bento-reveal-item mt-6 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-5 text-[#F1E5C5] shadow-gold">
            <h2 className="font-display text-2xl text-white">Confirmación</h2>

            <div className="mt-4 space-y-2 text-sm">
              <p><strong className="text-[#E5C158]">Mascota:</strong> {selectedPet?.name}</p>
              <p><strong className="text-[#E5C158]">Servicio:</strong> {selectedService?.name}</p>
              <p><strong className="text-[#E5C158]">Dirección:</strong> {location?.address}</p>
              <p><strong className="text-[#E5C158]">Fecha:</strong> {selectedSlot?.date}</p>
              <p><strong className="text-[#E5C158]">Hora:</strong> {selectedSlot?.time}</p>
              <p><strong className="text-[#E5C158]">Celular:</strong> {phone}</p>
              <p><strong className="text-[#E5C158]">Precio:</strong> {formatPrice(Number(finalPrice))}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!showTerms) setTermsViewed(true);
                setShowTerms(!showTerms);
              }}
              aria-expanded={showTerms}
              aria-controls="booking-terms"
              className="mt-6 w-full rounded-xl border border-[#D4AF37]/50 px-4 py-3 text-left font-semibold text-[#E5C158] hover:bg-[#D4AF37]/10"
            >
              {showTerms ? 'Ocultar términos y condiciones' : 'Leer términos y condiciones'}
            </button>

            {showTerms && (
              <section
                id="booking-terms"
                aria-label="Términos y condiciones de servicio"
                className="mt-3 max-h-80 space-y-4 overflow-y-auto rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] p-4 text-sm leading-relaxed text-[#F1E5C5]"
              >
                <h3 className="font-display text-lg text-white">
                  Términos y Condiciones de Servicio – Mascota Rey
                </h3>
                <div>
                  <h4 className="font-semibold text-[#E5C158]">
                    1. Estado físico y de salud de la mascota
                  </h4>
                  <p className="mt-1">
                    El propietario declara bajo su entera responsabilidad que el canino o felino
                    se encuentra en condiciones óptimas de salud para recibir el servicio de
                    estética. Mascota Rey no asume responsabilidad por lesiones, irritaciones o
                    incidentes derivados de nudos excesivos, mantos gravemente enmarañados,
                    descuidos higiénicos prolongados o patologías previas ocultas (problemas de
                    piel, orejas o dentadura) cuyo estado crítico obligue al personal a realizar
                    maniobras delicadas para evitar un daño mayor. El propietario acepta que un
                    pelaje en mal estado incrementa el riesgo operacional durante el procedimiento.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#E5C158]">
                    2. Ejemplares Caninos de Manejo Especial
                  </h4>
                  <p className="mt-1">
                    En cumplimiento del Código Nacional de Seguridad y Convivencia Ciudadana
                    (Ley 1801 de 2016), los propietarios de perros considerados de manejo especial
                    o razas de potencial riesgo están obligados a portar y utilizar bozal, traílla
                    y elementos de sujeción reglamentarios durante su ingreso, permanencia y salida
                    de las instalaciones, respondiendo civil y penalmente por cualquier daño que el
                    animal pueda ocasionar a terceros o al personal.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#E5C158]">
                    3. Puntualidad y Política de Recogida
                  </h4>
                  <p className="mt-1">
                    El cliente se compromete a recoger a su mascota dentro de los quince (15)
                    minutos siguientes a la notificación de finalización del servicio vía WhatsApp.
                    Superado este tiempo de gracia, se aplicará automáticamente un recargo único
                    de $5.000 COP por concepto de estadía y cuidado temporal prolongado.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#E5C158]">4. Aceptación previa</h4>
                  <p className="mt-1">
                    Al marcar la casilla de aceptación y agendar la cita en la plataforma, el
                    usuario manifiesta que ha leído, comprendido y aceptado la totalidad de estas
                    condiciones operativas y legales.
                  </p>
                </div>
              </section>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] p-4 text-sm text-[#F1E5C5]">
              <input
                type="checkbox"
                checked={termsAccepted}
                disabled={!termsViewed}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  if (event.target.checked) setBookingError(null);
                }}
                className="mt-0.5 h-4 w-4 accent-[#D4AF37] disabled:cursor-not-allowed"
              />
              <span>
                He leído, comprendido y acepto los términos y condiciones de servicio de Mascota
                Rey.
                {!termsViewed && (
                  <span className="mt-1 block text-xs text-[#F1E5C5]/60">
                    Primero abre el botón de términos y condiciones para continuar.
                  </span>
                )}
              </span>
            </label>

            {bookingError && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {bookingError}
              </div>
            )}

            <button
              type="button"
              onClick={confirmBooking}
              disabled={isBooking || !termsAccepted}
              className="mt-6 w-full rounded-full bg-[#D4AF37] px-4 py-3 font-semibold text-[#0F0F0F] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBooking ? 'Agendando...' : 'Confirmar cita'}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => {
              if (step === 4) {
                setTermsAccepted(false);
                setShowTerms(false);
                setTermsViewed(false);
              }
              setStep((prev) => Math.max(prev - 1, 1));
            }}
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