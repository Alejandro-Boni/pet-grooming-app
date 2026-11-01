import { useEffect, useState } from 'react';

const contact = {
  phone1: '+57 320 436 5478',
  phone1Href: 'tel:+573204365478',
  phone2: '+57 316 905 6888',
  phone2Href: 'tel:+573169056888',
  whatsapp1: 'https://wa.me/573204365478',
  whatsapp2: 'https://wa.me/573169056888',
  instagram: 'https://www.instagram.com/mascota.rey/',
  tiktok: 'https://www.tiktok.com/@mascota.rey?_r=1&_t=ZS-9B3PgBxftTg',
};

export default function AboutUs() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`space-y-5 pb-8 transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Nosotros</p>
        <h1 className="mt-3 font-display text-3xl text-white">Mascota Rey</h1>

        <p className="mt-4 text-sm leading-7 text-[#F1E5C5]">
          Somos una peluquería y spa para mascotas creada para ofrecer un servicio
          cómodo, seguro y lleno de cariño. Pensamos cada cita como una experiencia
          personalizada para que tus perros y gatos reciban atención con higiene,
          respeto y estilo.
        </p>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Nuestra misión</p>
        <p className="mt-3 text-sm leading-7 text-[#F1E5C5]">
          Brindar un servicio profesional y humano que cuide el bienestar físico y
          emocional de cada mascota, ayudando a sus familias a vivir la tranquilidad
          de saber que están en buenas manos.
        </p>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Nuestra visión</p>
        <p className="mt-3 text-sm leading-7 text-[#F1E5C5]">
          Ser la opción preferida para el cuidado de mascotas en la ciudad,
          combinando tecnología, atención cálida y excelencia en cada servicio.
        </p>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Nuestro equipo</p>

        <div className="mt-4 rounded-[20px] border border-dashed border-[#D4AF37]/30 bg-[#0F0F0F] p-5 text-sm text-[#F1E5C5]">
          Información del equipo disponible próximamente.
        </div>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Contacto</p>

        <div className="mt-4 space-y-3">
          <a
            href={contact.whatsapp1}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] px-6 py-3.5 text-base font-semibold text-[#0F0F0F] shadow-[0_12px_26px_rgba(212,175,55,0.28)] transition hover:brightness-110"
          >
            Chatea por WhatsApp
          </a>

          <a
            href={contact.phone1Href}
            className="flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#0F0F0F] px-6 py-3.5 text-base font-medium text-[#F1E5C5] transition hover:border-[#D4AF37]/50"
          >
            Llamar ahora
          </a>

          <div className="mt-4 space-y-3 text-sm text-[#F1E5C5]">
            <a
              href={contact.phone1Href}
              className="block rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3 transition hover:border-[#D4AF37]/50"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#E5C158]">Línea 1</p>
              <p className="mt-2 font-medium text-white">{contact.phone1}</p>
            </a>

            <a
              href={contact.phone2Href}
              className="block rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3 transition hover:border-[#D4AF37]/50"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#E5C158]">Línea 2</p>
              <p className="mt-2 font-medium text-white">{contact.phone2}</p>
            </a>

            <a
              href={contact.whatsapp2}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3 transition hover:border-[#D4AF37]/50"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[#E5C158]">WhatsApp 2</p>
              <p className="mt-2 font-medium text-white">{contact.phone2}</p>
            </a>
          </div>
        </div>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Síguenos</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            className="rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3 text-center text-sm font-medium text-white transition hover:border-[#D4AF37]/50"
          >
            Instagram
          </a>

          <a
            href={contact.tiktok}
            target="_blank"
            rel="noreferrer"
            className="rounded-[18px] border border-[#D4AF37]/20 bg-[#0F0F0F] p-3 text-center text-sm font-medium text-white transition hover:border-[#D4AF37]/50"
          >
            TikTok
          </a>
        </div>
      </section>

      <section className="royal-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">¿Por qué elegirnos?</p>

        <ul className="mt-4 space-y-2 text-sm text-[#F1E5C5]">
          <li>• Atención personalizada para cada mascota.</li>
          <li>• Servicio seguro, limpio y con trayectoria.</li>
          <li>• Planificación cómoda para citas y traslados.</li>
          <li>• Experiencia pensada para pets y tutores.</li>
        </ul>
      </section>
    </div>
  );
}