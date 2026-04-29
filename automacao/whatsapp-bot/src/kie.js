const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

function extractText(payload) {
  return (
    payload?.choices?.[0]?.message?.content ||
    payload?.choices?.[0]?.text ||
    payload?.message?.content ||
    payload?.content ||
    payload?.response ||
    ''
  ).trim();
}

function sanitizeReply(text) {
  const fallback = 'Posso te ajudar com a Primeflix. Voce quer ver os valores ou fazer um teste?';
  const value = String(text || '').trim() || fallback;
  const blocked = /(R\$|black friday|promo[cç][aã]o|plano\s+\w+|\b\d+\s*(reais|meses|dias)\b)/i;

  if (blocked.test(value)) {
    return 'Vou te responder certinho por aqui. Se quiser valores, eu te envio a arte oficial.';
  }

  return value.slice(0, 900);
}

async function generateReply({ text, name }) {
  if (!config.kieApiKey) {
    logger.warn('KIE_API_KEY ausente. Usando resposta segura local.');
    return 'Oi! Posso te ajudar com a Primeflix. Voce quer conhecer os valores ou fazer um teste?';
  }

  const response = await axios.post(
    config.kieApiUrl,
    {
      model: config.kieModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Voce atende clientes da Primeflix pelo WhatsApp. Responda curto, natural e vendedor. Nunca invente preco, plano, prazo ou promocao. Se perguntarem valor, plano ou preco, diga que vai enviar a arte oficial. Se pedirem teste, confirme se podem testar agora porque dura 1 hora. Black Friday so manual pelo Arthur.'
        },
        {
          role: 'user',
          content: `Cliente: ${name || 'Cliente'}\nMensagem: ${text || ''}`
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${config.kieApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: config.requestTimeoutMs
    }
  );

  return sanitizeReply(extractText(response.data));
}

module.exports = { generateReply };
