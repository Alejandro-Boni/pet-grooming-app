import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StepIndicator from '../../components/StepIndicator';
import PetCard from '../../components/PetCard';
import AddressInput from '../../components/AddressInput';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { formatPrice } from '../../utils/format';

const STEPS = ['Mascota', 'Servicio', 'Dirección y horario', 'Confirmación'];

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [location, setLocation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    api.get('/api/pets').then((data) => setPets(data.pets));
    api.get('/api/services').then((data) => setServices(data.services));
  }, []);

  async function confirmBooking() {
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
      });
      setConfirmedAppointment(appointment);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsBooking(false);
    }
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

              {formatPrice(selectedService.price_cop) && (
                <>
                  <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Precio</p>
                  <p className="mt-2 text-lg font-semibold text-[#E5C158]">
                    {formatPrice(selectedService.price_cop)}
                  </p>
                </>
              )}

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Dirección</p>
              <p className="mt-2 text-[#F1E5C5]">{location.address}</p>

              <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[#E5C158]">Fecha y hora</p>
              <p className="mt-2 text-[#F1E5C5]">
                {confirmedAppointment.appointment_date} a las {confirmedAppointment.start_time}
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm text-[#F1E5C5]">
              Recomendación: trae a tu mascota con collar y correa, y evita darle de comer en la hora previa a su baño.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="royal-panel">
          <StepIndicator steps={STEPS} currentStep={step} />

          {step === 1 && (
            <div className="mt-6">
              <h1 className="font-display text-3xl text-white">¿Quién nos visita?</h1>

              <div className="mt-5 space-y-3">
                {pets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    selected={selectedPet?.id === pet.id}
                    onSelect={setSelectedPet}
                  />
                ))}

                {pets.length === 0 && (
                  <p className="rounded-2xl border border-[#D4AF37]/30 bg-[#0F0F0F] p-4 text-sm text-[#F1E5C5]">
                    Primero registra a tu mascota en la pestaña "Mis mascotas".
                  </p>
                )}
              </div>

              <button
                disabled={!selectedPet}
                onClick={() => setStep(2)}
                className="gold-button mt-6 w-full px-6 py-3 disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6">
              <h1 className="font-display text-3xl text-white">Elige el servicio</h1>

              <div className="mt-5 space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`glass-card w-full p-5 text-left transition duration-200 ${
                      selectedService?.id === service.id ? 'scale-[1.01] border-[#D4AF37] shadow-gold' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-white">{service.name}</p>
                        <p className="mt-1 text-sm text-[#F1E5C5]">{service.description}</p>
                      </div>

                      {formatPrice(service.price_cop ?? 0) && (
                        <p className="shrink-0 font-display text-xl text-[#E5C158]">
                          {formatPrice(service.price_cop ?? 0)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-3 text-sm font-medium text-[#F1E5C5]"
                >
                  Atrás
                </button>

                <button
                  disabled={!selectedService}
                  onClick={() => setStep(3)}
                  className="gold-button flex-1 px-6 py-3 disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6">
              <h1 className="font-display text-3xl text-white">¿A dónde te visitamos?</h1>
              <p className="mt-2 text-sm text-[#F1E5C5]">
                Como el servicio se presta desde nuestro vehículo, esto nos ayuda a calcular el traslado con tráfico real.
              </p>

              <div className="mt-5">
                <AddressInput
                  onConfirm={(loc) => {
                    setLocation(loc);
                    setSelectedSlot(null);
                  }}
                />
              </div>

              {location && (
                <div className="mt-6">
                  <h2 className="font-display text-2xl text-white">Elige día y hora</h2>
                  <div className="mt-3">
                    <AvailabilityCalendar
                      petId={selectedPet.id}
                      serviceId={selectedService.id}
                      lat={location.lat}
                      lng={location.lng}
                      onSelectSlot={setSelectedSlot}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-3 text-sm font-medium text-[#F1E5C5]"
                >
                  Atrás
                </button>

                <button
                  disabled={!selectedSlot}
                  onClick={() => setStep(4)}
                  className="gold-button flex-1 px-6 py-3 disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6">
              <h1 className="font-display text-3xl text-white">Confirma tu cita</h1>

              <div className="mt-5 space-y-2 rounded-[26px] border border-[#D4AF37]/30 bg-[#0F0F0F] p-5 text-sm">
                <p><span className="text-[#F1E5C5]">Mascota:</span> {selectedPet.name}</p>
                <p><span className="text-[#F1E5C5]">Servicio:</span> {selectedService.name}</p>
                {formatPrice(selectedService.price_cop) && (
                  <p><span className="text-[#F1E5C5]">Precio:</span> {formatPrice(selectedService.price_cop)}</p>
                )}
                <p><span className="text-[#F1E5C5]">Dirección:</span> {location.address}</p>
                <p><span className="text-[#F1E5C5]">Fecha:</span> {selectedSlot.date}</p>
                <p><span className="text-[#F1E5C5]">Hora:</span> {selectedSlot.time}</p>
              </div>

              <div className="mt-4 rounded-[24px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm text-[#F1E5C5]">
                Recomendación: trae a tu mascota con collar y correa.
              </div>

              {bookingError && <p className="mt-3 text-sm text-red-300">{bookingError}</p>}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-3 text-sm font-medium text-[#F1E5C5]"
                >
                  Atrás
                </button>

                <button
                  disabled={isBooking}
                  onClick={confirmBooking}
                  className="gold-button flex-1 px-6 py-3 disabled:opacity-60"
                >
                  {isBooking ? 'Agendando…' : 'Confirmar cita'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}