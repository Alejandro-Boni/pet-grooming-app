function normalizePhone(phone) {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('57')) {
    return digits;
  }

  return `57${digits}`;
}

function buildWhatsAppLink(phone, message) {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return null;

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function sendAppointmentReminder({ phone, type, message }) {
  const link = buildWhatsAppLink(phone, message);

  return {
    ok: true,
    type,
    whatsapp_link: link,
    phone,
    message,
  };
}

module.exports = {
  normalizePhone,
  buildWhatsAppLink,
  sendAppointmentReminder,
};