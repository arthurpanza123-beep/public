const axios = require('axios');
const config = require('./config');
const logger = require('./logger');

function formatHistory(history = []) {
  return history
    .filter((item) => item?.body)
    .slice(-8)
    .map((item) => `${item.direction === 'in' ? 'Cliente' : 'Primeflix'}: ${item.body}`)
    .join('\n');
}

function formatObsidian(snippets = []) {
  if (!snippets.length) return '';
  return snippets.map((item) => `Nota ${item.file}: ${item.text}`).join('\n');
}

async function generateReply({ customer, messageText, conversationHistory = [], knowledgeBase, customerStage, intent, obsidianContext = [] }) {
  if (!config.localAiEnabled) {
    const error = new Error('LOCAL_AI_ENABLED=false.');
    error.code = 'LOCAL_AI_DISABLED';
    throw error;
  }

  const url = `${config.localAiBaseUrl.replace(/\/$/, '')}/api/chat`;
  const system = knowledgeBase.buildSystemPrompt({ messageText, customerStage, intent });
  const user = [
    `Cliente: ${customer?.name || 'Cliente'}`,
    `Mensagem atual: ${messageText || ''}`,
    'Historico recente:',
    formatHistory(conversationHistory) || 'Sem historico recente.',
    'Notas do Obsidian relevantes:',
    formatObsidian(obsidianContext) || 'Sem notas relevantes.'
  ].join('\n');

  logger.info(
    {
      event: 'LOCAL_AI_REQUEST',
      url,
      model: config.localAiModel,
      promptSize: system.length + user.length,
      timeout: config.localAiTimeoutMs
    },
    'LOCAL_AI_REQUEST'
  );

  try {
    const response = await axios.post(
      url,
      {
        model: config.localAiModel,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        options: {
          temperature: 0.4,
          num_predict: 180
        }
      },
      { timeout: config.localAiTimeoutMs }
    );

    const raw = response.data?.message?.content || response.data?.response || '';
    const text = knowledgeBase.sanitizeWhatsAppReply(raw, { stage: customerStage, intent });
    logger.info({ status: response.status, text: text.slice(0, 300) }, 'LOCAL_AI_RESPONSE');
    return text;
  } catch (error) {
    logger.error(
      {
        event: 'LOCAL_AI_ERROR',
        status: error.response?.status,
        body: error.response?.data,
        message: error.message
      },
      'LOCAL_AI_ERROR'
    );
    throw error;
  }
}

module.exports = {
  generateReply
};
