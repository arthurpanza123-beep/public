const config = require('./config');
const logger = require('./logger');
const supabase = require('./supabase');
const kie = require('./kie');
const { normalizePhone } = require('./phone');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeIncoming(payload) {
  const phone = normalizePhone(payload.phone)
    || normalizePhone(payload.raw?.key?.senderPn)
    || normalizePhone(payload.jid);
  const name = payload.pushName || 'Cliente';
  const text = payload.message?.text || payload.Texto || payload.text || '';
  const messageType = payload.message?.type || 'text';

  if (!phone) {
    throw new Error('Telefone do cliente nao identificado.');
  }

  return {
    phone,
    name,
    text,
    messageType,
    messageId: payload.messageId || '',
    replyTo: payload.jid || phone
  };
}

function isPaused(customer) {
  if (customer.assigned_to_human) return true;
  if (!customer.bot_paused_until) return false;
  return new Date(customer.bot_paused_until).getTime() > Date.now();
}

function isPricingQuestion(text) {
  return /\b(valor|valores|preco|preço|plano|planos|quanto|mensal|mensalidade)\b/i.test(text || '');
}

async function saveOutboundMedia(customerId, mediaUrl, body = '') {
  await supabase.saveMessage({
    customerId,
    direction: 'out',
    body,
    mediaUrl,
    sentBy: 'bot'
  });
}

async function sendInitialFlow({ whatsapp, to, customerId }) {
  await whatsapp.sendAudio({ to, fileName: config.audio01, ptt: true });
  await saveOutboundMedia(customerId, config.audio01);

  await sleep(config.initialFlowDelayMs);
  await whatsapp.sendAudio({ to, fileName: config.audio02, ptt: true });
  await saveOutboundMedia(customerId, config.audio02);

  await sleep(config.initialFlowDelayMs);
  await whatsapp.sendImage({ to, fileName: config.imageFeedbacks, caption: config.feedbacksCaption });
  await saveOutboundMedia(customerId, config.imageFeedbacks, config.feedbacksCaption);

  await sleep(config.initialFlowDelayMs);
  await whatsapp.sendAudio({ to, fileName: config.audio03, ptt: true });
  await saveOutboundMedia(customerId, config.audio03);
}

async function sendValues({ whatsapp, to, customerId }) {
  await whatsapp.sendImage({ to, fileName: config.imageValores, caption: config.valuesCaption });
  await saveOutboundMedia(customerId, config.imageValores, config.valuesCaption);
}

async function processIncomingMessage(payload, whatsapp) {
  const incoming = normalizeIncoming(payload);

  const customer = await supabase.upsertCustomer({
    phone: incoming.phone,
    name: incoming.name
  });

  await supabase.saveMessage({
    customerId: customer.id,
    direction: 'in',
    body: incoming.text,
    sentBy: 'client'
  });

  if (isPaused(customer)) {
    logger.info({ phone: incoming.phone }, 'Bot pausado para atendimento humano. Nenhuma resposta enviada.');
    return;
  }

  if (!customer.flow_initial_sent) {
    await sendInitialFlow({ whatsapp, to: incoming.replyTo, customerId: customer.id });
    await supabase.markInitialFlowSent(customer.id);
    logger.info({ phone: incoming.phone }, 'Fluxo inicial enviado e marcado no Supabase.');
    return;
  }

  if (isPricingQuestion(incoming.text)) {
    await sendValues({ whatsapp, to: incoming.replyTo, customerId: customer.id });
    logger.info({ phone: incoming.phone }, 'Arte de valores enviada.');
    return;
  }

  let responseText;
  try {
    responseText = await kie.generateReply({ text: incoming.text, name: incoming.name });
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Falha ao chamar KIE AI. Enviando resposta segura.');
    responseText = 'Vou te ajudar. Me diz se voce quer ver os valores ou fazer um teste agora.';
  }

  await whatsapp.sendText({ to: incoming.replyTo, text: responseText });
  await supabase.saveMessage({
    customerId: customer.id,
    direction: 'out',
    body: responseText,
    sentBy: 'bot'
  });
}

module.exports = {
  processIncomingMessage,
  normalizeIncoming
};
