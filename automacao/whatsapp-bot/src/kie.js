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
  const fallback = 'Vou verificar isso rapidinho pra te passar certinho.';
  const value = String(text || '').trim() || fallback;
  const blocked = /(R\$|black friday|promo[cç][aã]o|\b\d+\s*(reais|meses|dias)\b)/i;

  if (blocked.test(value)) {
    return 'Vou te mandar a arte oficial com os valores certinhos.';
  }

  return value.slice(0, 900);
}

function formatConversationHistory(history = []) {
  return history
    .filter((item) => item?.body)
    .map((item) => `${item.direction === 'in' ? 'Cliente' : 'Primeflix'}: ${item.body}`)
    .join('\n');
}

function buildMessages({ customer, messageText, conversationHistory, knowledgeBase }) {
  return [
    {
      role: 'system',
      content: knowledgeBase.buildSystemPrompt()
    },
    {
      role: 'user',
      content: [
        `Cliente: ${customer?.name || 'Cliente'}`,
        `Telefone: ${customer?.phone || ''}`,
        customer?.learnedAnswerContext ? `Resposta aprendida aprovada para pergunta parecida: ${customer.learnedAnswerContext}` : '',
        'Historico recente:',
        formatConversationHistory(conversationHistory) || 'Sem historico recente.',
        `Mensagem atual: ${messageText || ''}`
      ].filter(Boolean).join('\n')
    }
  ];
}

async function generateReply({ customer, messageText, conversationHistory = [], knowledgeBase }) {
  if (!config.kieApiKey) {
    const error = new Error('KIE_API_KEY ausente.');
    error.code = 'KIE_MISSING_API_KEY';
    throw error;
  }

  const messages = buildMessages({ customer, messageText, conversationHistory, knowledgeBase });
  const requestBody = {
    model: config.kieModel,
    temperature: 0.2,
    messages
  };

  logger.info(
    {
      event: 'KIE_REQUEST',
      model: config.kieModel,
      customerId: customer?.id,
      phone: customer?.phone,
      messageText
    },
    'KIE_REQUEST'
  );

  try {
    const response = await axios.post(
      config.kieApiUrl,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${config.kieApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: config.requestTimeoutMs
      }
    );

    const reply = sanitizeReply(extractText(response.data));
    logger.info(
      {
        event: 'KIE_RESPONSE',
        status: response.status,
        customerId: customer?.id,
        phone: customer?.phone,
        reply
      },
      'KIE_RESPONSE'
    );
    return reply;
  } catch (error) {
    logger.error(
      {
        event: 'KIE_ERROR',
        status: error.response?.status,
        body: error.response?.data,
        message: error.message,
        customerId: customer?.id,
        phone: customer?.phone
      },
      'KIE_ERROR'
    );
    throw error;
  }
}

module.exports = { generateReply, sanitizeReply };
