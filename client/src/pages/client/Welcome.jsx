import { Link } from 'react-router-dom';


const BUSINESS = {
  name: 'Mascota Rey',
  tagline: 'La perruquería canina y felina.',
  hours: [
    ['Lunes a sábado', '7:00 am – 6:00 pm'],
    ['Domingo', 'Cerrado'],
  ],
  coverage: 'Bogotá y zonas aledañas: Cajicá, Soacha, Zipaquirá, Sopó, Briceño, Chía, Suesca, La Calera, Guatavita, Choachi, Cota, Funza, Mosquera, Madrid, Facatativa, Tenjo.',
};

export default function Welcome() {
  return (
    <div className="min-h-screen bg-linen">
      <section className="grid sm:grid-cols-2">
        <div className="bg-[#111111] px-6 py-14 text-white sm:px-12 sm:py-24">
          <h1 className="max-w-sm font-display text-4xl leading-tight text-[#F7F1E3] sm:text-5xl">
  {BUSINESS.name}
</h1>
          <p className="mt-5 max-w-xs text-[#F1E5C5]">{BUSINESS.tagline}</p>
          <Link
  to="/login"
  className="mt-8 inline-flex items-center justify-center rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] px-6 py-3 text-sm font-semibold text-[#0F0F0F] shadow-gold transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
>
  Agendar una cita
</Link>
        </div>

        <div className="px-6 py-10 sm:px-12 sm:py-24">
          <div>
            <h2 className="font-display text-xl text-ink">Horario de atención</h2>
            <dl className="mt-4 space-y-2">
              {BUSINESS.hours.map(([day, hours]) => (
                <div key={day} className="flex justify-between border-b border-sage/40 pb-2 text-sm">
                  <dt className="text-ink/60">{day}</dt>
                  <dd className="text-ink">{hours}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl text-ink">Zona de cobertura</h2>
            <p className="mt-2 text-sm text-ink/70">{BUSINESS.coverage}</p>
          </div>
        </div>
      </section>
    </div>
  );
}