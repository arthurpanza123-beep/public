const config = require('./config');
const logger = require('./logger');
const supabase = require('./supabase');
const kie = require('./kie');
const knowledgeBase = require('./knowledgeBase');
const { normalizePhone } = require('./phone');

const initialFlowInProgress = new Set();

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

async function saveOutboundText(customerId, text) {
  await supabase.saveMessage({
    customerId,
    direction: 'out',
    body: text,
    sentBy: 'bot'
  });
}

async function saveOutboundMedia(customerId, mediaUrl, body = '') {
  await supabase.saveMessage({
    customerId,
    direction: 'out',
    body: body || mediaUrl,
    mediaUrl,
    sentBy: 'bot'
  });
}

async function sendInitialFlow({ whatsapp, to, customerId }) {
  logger.info({ customerId }, 'Fluxo inicial: enviando apresentacao01.ogg.');
  await whatsapp.sendAudio({ to, fileName: config.audio01, ptt: true });
  await saveOutboundMedia(customerId, config.audio01);

  await sleep(config.initialFlowDelayMs);
  logger.info({ customerId }, 'Fluxo inicial: enviando apresentacao02.ogg.');
  await whatsapp.sendAudio({ to, fileName: config.audio02, ptt: true });
  await saveOutboundMedia(customerId, config.audio02);

  await sleep(config.initialFlowDelayMs);
  logger.info({ customerId }, 'Fluxo inicial: enviando feedbaks.jpeg com legenda oficial.');
  await whatsapp.sendImage({ to, fileName: config.imageFeedbacks, caption: config.feedbacksCaption });
  await saveOutboundMedia(customerId, config.imageFeedbacks, config.feedbacksCaption);

  await sleep(config.initialFlowDelayMs);
  logger.info({ customerId }, 'Fluxo inicial: enviando qualatv.ogg.');
  await whatsapp.sendAudio({ to, fileName: config.audio03, ptt: true });
  await saveOutboundMedia(customerId, config.audio03);
}

async function sendValues({ whatsapp, to, customerId }) {
  await whatsapp.sendImage({ to, fileName: config.imageValores, caption: config.valuesCaption });
  await saveOutboundMedia(customerId, config.imageValores, config.valuesCaption || 'valor.jpeg');
}

async function replyText({ whatsapp, to, customerId, text, logContext }) {
  await whatsapp.sendText({ to, text });
  await saveOutboundText(customerId, text);
  logger.info({ ...logContext, response: text }, 'MESSAGE_SENT');
}

async function sendQuestionToArthur({ customer, incoming, intent }) {
  const payload = {
    phone: incoming.phone,
    name: incoming.name,
    text: incoming.text,
    intent
  };

  try {
    await supabase.saveBotEvent({
      customerId: customer.id,
      phone: incoming.phone,
      event: 'needs_arthur_help',
      payload
    });

    await supabase.saveUnknownQuestion({
      question: incoming.text,
      tags: [intent.intent || 'unknown', 'arthur']
    });
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Nao foi possivel registrar duvida em bot_events/learned_answers.');
  }

  logger.warn(payload, 'DECISION=needs_arthur');
}

async function answerAfterInitialFlow({ whatsapp, incoming, customer }) {
  const intent = knowledgeBase.detectIntent(incoming.text);
  logger.info({ phone: incoming.phone, intent: intent.intent, action: intent.action, confidence: intent.confidence }, 'INTENT_DETECTED');

  let learnedAnswer = null;
  try {
    learnedAnswer = await supabase.findLearnedAnswer(incoming.text);
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Nao foi possivel consultar learned_answers. Continuando atendimento.');
  }
  if (learnedAnswer) {
    logger.info({ phone: incoming.phone, learnedAnswerId: learnedAnswer.id }, 'LEARNED_ANSWER_CONTEXT');
  }

  const baseAnswer = knowledgeBase.answerFromBase(incoming.text);
  if (baseAnswer?.action === 'send_values_image') {
    logger.info({ phone: incoming.phone, decision: 'send_values', intent: baseAnswer.intent }, 'DECISION=send_values');
    await sendValues({ whatsapp, to: incoming.replyTo, customerId: customer.id });
    logger.info({ phone: incoming.phone, response: config.imageValores }, 'MESSAGE_SENT');
    return;
  }

  if (baseAnswer?.intent === 'test_request') {
    logger.info({ phone: incoming.phone, decision: 'confirm_test_now', intent: baseAnswer.intent }, 'DECISION=confirm_test_now');
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: baseAnswer.answer,
      logContext: { phone: incoming.phone, decision: 'confirm_test_now', intent: baseAnswer.intent }
    });
    return;
  }

  if (intent.intent === 'human_help' || intent.intent === 'payment') {
    logger.info({ phone: incoming.phone, decision: 'needs_arthur', intent: intent.intent }, 'DECISION=needs_arthur');
    await sendQuestionToArthur({ customer, incoming, intent });
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: 'Vou chamar Arthur pra te ajudar certinho por aqui.',
      logContext: { phone: incoming.phone, decision: 'needs_arthur' }
    });
    return;
  }

  let responseText;
  try {
    logger.info({ phone: incoming.phone, decision: 'ai_reply', intent: intent.intent }, 'DECISION=ai_reply');
    const conversationHistory = await supabase.getRecentMessages(customer.id, 10);
    responseText = await kie.generateReply({
      customer: {
        ...customer,
        learnedAnswerContext: learnedAnswer?.answer || ''
      },
      messageText: incoming.text,
      conversationHistory,
      knowledgeBase
    });
    logger.info({ phone: incoming.phone, intent: intent.intent }, 'AI_RESPONSE_CREATED');
    if (/verificar|arthur|passar certinho/i.test(responseText)) {
      await sendQuestionToArthur({ customer, incoming, intent });
    }
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Falha ao chamar IA. Duvida sera enviada para Arthur.');
    await sendQuestionToArthur({ customer, incoming, intent });
    responseText = knowledgeBase.unknownQuestionFlow.clientAnswer;
  }

  await replyText({
    whatsapp,
    to: incoming.replyTo,
    customerId: customer.id,
    text: responseText,
    logContext: { phone: incoming.phone, decision: 'ai_reply', intent: intent.intent }
  });
}

async function processIncomingMessage(payload, whatsapp) {
  let incoming;

  try {
    incoming = normalizeIncoming(payload);
    logger.info(
      {
        phone: incoming.phone,
        name: incoming.name,
        messageType: incoming.messageType,
        messageId: incoming.messageId,
        text: incoming.text
      },
      'MESSAGE_RECEIVED'
    );

    const upsertedCustomer = await supabase.upsertCustomer({
      phone: incoming.phone,
      name: incoming.name
    });
    logger.info({ phone: incoming.phone, customerId: upsertedCustomer?.id }, 'CUSTOMER_FOUND');

    let customer = await supabase.getCustomerByPhone(incoming.phone);
    if (!customer?.id) {
      throw new Error(`Cliente nao encontrado apos upsert para o telefone ${incoming.phone}.`);
    }

    await supabase.saveMessage({
      customerId: customer.id,
      direction: 'in',
      body: incoming.text || `[${incoming.messageType}]`,
      sentBy: 'client'
    });
    logger.info({ phone: incoming.phone, customerId: customer.id }, 'MESSAGE_SAVED_IN');

    customer = await supabase.getCustomerByPhone(incoming.phone);
    logger.info({ phone: incoming.phone, flow_initial_sent: Boolean(customer.flow_initial_sent) }, `FLOW_INITIAL_SENT ${Boolean(customer.flow_initial_sent)}`);

    if (isPaused(customer)) {
      logger.info({ phone: incoming.phone, decision: 'pausa_humana' }, 'Bot pausado para Arthur. Nenhuma resposta enviada.');
      return;
    }

    if (!customer.flow_initial_sent) {
      if (initialFlowInProgress.has(incoming.phone)) {
        logger.info({ phone: incoming.phone, decision: 'fluxo_inicial_em_andamento' }, 'Fluxo inicial ja esta em andamento para este telefone.');
        return;
      }

      logger.info({ phone: incoming.phone, decision: 'initial_flow' }, 'DECISION=initial_flow');
      initialFlowInProgress.add(incoming.phone);
      try {
        await sendInitialFlow({ whatsapp, to: incoming.replyTo, customerId: customer.id });
        const updatedCustomer = await supabase.markInitialFlowSent(customer.id);
        logger.info(
          {
            phone: incoming.phone,
            flow_initial_sent: updatedCustomer?.flow_initial_sent,
            flow_initial_sent_at: updatedCustomer?.flow_initial_sent_at
          },
          'Fluxo inicial marcado como enviado no Supabase.'
        );
      } finally {
        initialFlowInProgress.delete(incoming.phone);
      }
      return;
    }

    await answerAfterInitialFlow({ whatsapp, incoming, customer });
  } catch (error) {
    logger.error({ err: error, phone: incoming?.phone }, 'Erro ao processar atendimento principal do Primeflix Bot.');
    throw error;
  }
}

module.exports = {
  processIncomingMessage,
  normalizeIncoming
};
