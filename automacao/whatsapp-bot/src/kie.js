const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

function joinUrl(baseUrl, endpoint) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const path = String(endpoint || '').replace(/^\/?/, '/');
  return `${base}${path}`;
}

function getKieUrl() {
  if (config.kieApiUrl) return config.kieApiUrl;
  return joinUrl(config.kieBaseUrl, config.kieChatEndpoint);
}

function extractText(payload) {
  if (Array.isArray(payload?.content)) {
    return payload.content
      .map((part) => part?.text || '')
      .join('')
      .trim();
  }

  return (
    payload?.choices?.[0]?.message?.content ||
    payload?.choices?.[0]?.text ||
    payload?.message?.content ||
    payload?.content?.text ||
    payload?.content ||
    payload?.response ||
    ''
  ).trim();
}

function sanitizeReply(text) {
  const fallback = 'Me fala se você quer ver valores, instalar no aparelho ou liberar um teste.';
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

function formatObsidian(snippets = []) {
  if (!snippets.length) return '';
  return snippets.map((item) => `Nota ${item.file}: ${item.text}`).join('\n');
}

function buildPrompt({ customer, messageText, conversationHistory, knowledgeBase, obsidianContext = [] }) {
  return [
    `Cliente: ${customer?.name || 'Cliente'}`,
    `Telefone: ${customer?.phone || ''}`,
    customer?.learnedAnswerContext ? `Resposta aprendida aprovada para pergunta parecida: ${customer.learnedAnswerContext}` : '',
    'Historico recente:',
    formatConversationHistory(conversationHistory) || 'Sem historico recente.',
    'Notas do Obsidian relevantes:',
    formatObsidian(obsidianContext) || 'Sem notas relevantes.',
    `Mensagem atual: ${messageText || ''}`
  ].filter(Boolean).join('\n');
}

function buildRequestBody({ customer, messageText, conversationHistory, knowledgeBase, maxTokens, customerStage, intent, obsidianContext }) {
  return {
    model: config.kieModel,
    max_tokens: maxTokens || config.kieMaxTokens,
    system: knowledgeBase.buildSystemPrompt({ messageText, customerStage, intent }),
    messages: [
      {
        role: 'user',
        content: buildPrompt({ customer, messageText, conversationHistory, knowledgeBase, obsidianContext })
      }
    ]
  };
}

function buildHeaders() {
  return {
    Authorization: `Bearer ${config.kieApiKey}`,
    'X-Api-Key': config.kieApiKey,
    'anthropic-version': config.kieAnthropicVersion,
    'Content-Type': 'application/json'
  };
}

async function generateReply({ customer, messageText, conversationHistory = [], knowledgeBase, maxTokens, customerStage, intent, obsidianContext = [] }) {
  if (!config.kieApiKey) {
    const error = new Error('KIE_API_KEY ausente.');
    error.code = 'KIE_MISSING_API_KEY';
    throw error;
  }

  const url = getKieUrl();
  const requestBody = buildRequestBody({ customer, messageText, conversationHistory, knowledgeBase, maxTokens, customerStage, intent, obsidianContext });
  const promptSize = JSON.stringify(requestBody).length;

  logger.info(
    {
      event: 'KIE_REQUEST',
      url,
      model: config.kieModel,
      promptSize,
      timeout: config.kieTimeoutMs
    },
    'KIE_REQUEST'
  );

  try {
    const response = await axios.post(
      url,
      requestBody,
      {
        headers: buildHeaders(),
        timeout: config.kieTimeoutMs
      }
    );

    const reply = knowledgeBase.sanitizeWhatsAppReply
      ? knowledgeBase.sanitizeWhatsAppReply(sanitizeReply(extractText(response.data)), { stage: customerStage, intent })
      : sanitizeReply(extractText(response.data));
    logger.info(
      {
        event: 'KIE_RESPONSE',
        status: response.status,
        text: reply.slice(0, 300)
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
        message: error.message
      },
      'KIE_ERROR'
    );
    throw error;
  }
}

module.exports = {
  generateReply,
  sanitizeReply,
  getKieUrl,
  buildRequestBody
};
