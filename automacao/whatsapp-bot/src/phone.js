function normalizePhone(value) {
  if (!value) return '';
  const raw = String(value);
  if (raw.endsWith('@s.whatsapp.net') || raw.endsWith('@g.us')) {
    return raw.split('@')[0].replace(/\D/g, '');
  }
  return raw.replace(/\D/g, '');
}

function toJid(value) {
  if (!value) throw new Error('Destino WhatsApp ausente.');
  const raw = String(value).trim();
  if (raw.endsWith('@s.whatsapp.net') || raw.endsWith('@g.us') || raw.endsWith('@lid')) return raw;
  const phone = normalizePhone(raw);
  if (!phone) throw new Error('Destino WhatsApp invalido.');
  return `${phone}@s.whatsapp.net`;
}

module.exports = { normalizePhone, toJid };
