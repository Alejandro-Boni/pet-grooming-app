import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StepIndicator from '../../components/StepIndicator';
import PetCard from '../../components/PetCard';
import AddressInput from '../../components/AddressInput';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';

const STEPS = ['Mascota', 'Servicio', 'Dirección y horario', 'Confirmación'];

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [location, setLocation] = useState(null); // { address, lat, lng }
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
      <div>
        <h1 className="font-display text-2xl text-ink">Cita confirmada</h1>
        <div className="mt-5 rounded-xl border border-sage/50 bg-cream p-5">
          <p className="text-sm text-ink/60">Mascota</p>
          <p className="font-display text-lg text-ink">{selectedPet.name}</p>
          <p className="mt-3 text-sm text-ink/60">Servicio</p>
          <p className="text-ink">{selectedService.name}</p>
          <p className="mt-3 text-sm text-ink/60">Dirección</p>
          <p className="text-ink">{location.address}</p>
          <p className="mt-3 text-sm text-ink/60">Fecha y hora</p>
          <p className="text-ink">
            {confirmedAppointment.appointment_date} a las {confirmedAppointment.start_time}
          </p>
        </div>
        <div className="mt-5 rounded-xl bg-ochre/10 p-4 text-sm text-ink/80">
          Recomendación: trae a tu mascota con collar y correa, y evita darle de comer en la hora previa a su baño.
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 1 && (
        <div className="mt-6">
          <h1 className="font-display text-2xl text-ink">¿Quién nos visita?</h1>
          <div className="mt-4 space-y-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} selected={selectedPet?.id === pet.id} onSelect={setSelectedPet} />
            ))}
            {pets.length === 0 && (
              <p className="text-sm text-ink/50">
                Primero registra a tu mascota en la pestaña "Mis mascotas".
              </p>
            )}
          </div>
          <button
            disabled={!selectedPet}
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-full bg-pine py-2.5 text-sm font-medium text-cream disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <h1 className="font-display text-2xl text-ink">Elige el servicio</h1>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedService?.id === service.id ? 'border-ochre bg-ochre/5' : 'border-sage/50 bg-cream'
                }`}
              >
                <p className="font-display text-lg text-ink">{service.name}</p>
                <p className="mt-1 text-sm text-ink/60">{service.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-full border border-sage/60 py-2.5 text-sm text-ink/70">
              Atrás
            </button>
            <button
              disabled={!selectedService}
              onClick={() => setStep(3)}
              className="flex-1 rounded-full bg-pine py-2.5 text-sm font-medium text-cream disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <h1 className="font-display text-2xl text-ink">¿A dónde te visitamos?</h1>
          <p className="mt-1 text-sm text-ink/60">
            Como el servicio se presta desde nuestro vehículo, esto nos ayuda a calcular el traslado con tráfico real.
          </p>
          <div className="mt-4">
            <AddressInput
              onConfirm={(loc) => {
                setLocation(loc);
                setSelectedSlot(null);
              }}
            />
          </div>

          {location && (
            <div className="mt-6">
              <h2 className="font-display text-xl text-ink">Elige día y hora</h2>
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
            <button onClick={() => setStep(2)} className="flex-1 rounded-full border border-sage/60 py-2.5 text-sm text-ink/70">
              Atrás
            </button>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="flex-1 rounded-full bg-pine py-2.5 text-sm font-medium text-cream disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-6">
          <h1 className="font-display text-2xl text-ink">Confirma tu cita</h1>
          <div className="mt-4 space-y-2 rounded-xl border border-sage/50 bg-cream p-5 text-sm">
            <p><span className="text-ink/60">Mascota:</span> {selectedPet.name}</p>
            <p><span className="text-ink/60">Servicio:</span> {selectedService.name}</p>
            <p><span className="text-ink/60">Dirección:</span> {location.address}</p>
            <p><span className="text-ink/60">Fecha:</span> {selectedSlot.date}</p>
            <p><span className="text-ink/60">Hora:</span> {selectedSlot.time}</p>
          </div>
          <div className="mt-4 rounded-xl bg-ochre/10 p-4 text-sm text-ink/80">
            Recomendación: trae a tu mascota con collar y correa.
          </div>
          {bookingError && <p className="mt-3 text-sm text-clay">{bookingError}</p>}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 rounded-full border border-sage/60 py-2.5 text-sm text-ink/70">
              Atrás
            </button>
            <button
              disabled={isBooking}
              onClick={confirmBooking}
              className="flex-1 rounded-full bg-ochre py-2.5 text-sm font-medium text-cream disabled:opacity-60"
            >
              {isBooking ? 'Agendando…' : 'Confirmar cita'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
