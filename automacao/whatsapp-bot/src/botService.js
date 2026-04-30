const config = require('./config');
const logger = require('./logger');
const supabase = require('./supabase');
const kie = require('./kie');
const localAi = require('./localAi');
const knowledgeBase = require('./knowledgeBase');
const obsidianKnowledge = require('./obsidianKnowledge');
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
  await replyText({
    whatsapp,
    to,
    customerId,
    text: 'Claro, vou te mandar os valores.',
    logContext: { decision: 'send_values_intro' }
  });
  await whatsapp.sendImage({ to, fileName: config.imageValores, caption: config.valuesCaption });
  await saveOutboundMedia(customerId, config.imageValores, config.valuesCaption || 'valor.jpeg');
  logger.info({ customerId, response: config.imageValores }, 'VALUE_IMAGE_SENT');
}

async function replyText({ whatsapp, to, customerId, text, logContext = {}, stage = '', intent = '' }) {
  const safeText = knowledgeBase.sanitizeWhatsAppReply(text, { stage, intent });
  await whatsapp.sendText({ to, text: safeText });
  await saveOutboundText(customerId, safeText);
  logger.info({ ...logContext, response: safeText }, 'MESSAGE_SENT');
}

async function safeUpdateStage(customerId, stage) {
  if (!stage) return;
  try {
    await supabase.updateCustomerStage(customerId, stage);
  } catch (error) {
    logger.error({ err: error, customerId, stage }, 'Nao foi possivel atualizar customer.stage.');
  }
}

function isNameLike(text) {
  const value = String(text || '').trim();
  if (!value || value.length > 40) return false;
  return !/\b(valor|preco|preço|teste|tv|smart|android|iphone|box|fire|pix|pagamento|travando|erro)\b/i.test(value);
}

function fakeTestExpiration() {
  return new Date(Date.now() + 60 * 60 * 1000).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function sendFakeTestCredentials({ whatsapp, to, customerId }) {
  const text = [
    '[MODO TESTE]',
    'Teste gratuito liberado para simulação.',
    `Provedor: ${config.testFakeProvider}`,
    `Usuário: ${config.testFakeUser}`,
    `Senha: ${config.testFakePassword}`,
    `Vencimento: ${fakeTestExpiration()}`,
    'Agora é só colocar esses dados no aplicativo e testar.'
  ].join('\n');

  await replyText({
    whatsapp,
    to,
    customerId,
    text,
    logContext: { decision: 'fake_test_sent' },
    stage: knowledgeBase.stages.aiService,
    intent: 'fake_test'
  });
  logger.info({ customerId }, 'FAKE_TEST_SENT');
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
      tags: [intent.intent || intent.stage || 'unknown', 'arthur']
    });
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Nao foi possivel registrar duvida em bot_events/learned_answers.');
  }

  logger.warn(payload, 'DECISION=needs_arthur');
}

async function answerAfterInitialFlow({ whatsapp, incoming, customer }) {
  const customerStage = knowledgeBase.stageFromCustomer(customer);

  if (customerStage === knowledgeBase.stages.waitingName && isNameLike(incoming.text)) {
    logger.info({ phone: incoming.phone, stage: customerStage }, 'STAGE_DETECTED');
    logger.info({ phone: incoming.phone, intent: 'captured_name' }, 'INTENT_DETECTED');
    logger.info({ phone: incoming.phone, decision: 'save_name' }, 'DECISION');
    try {
      await supabase.updateCustomerProfile(customer.id, {
        name: incoming.text.trim(),
        stage: knowledgeBase.stages.waitingDevice
      });
    } catch (error) {
      logger.error({ err: error, phone: incoming.phone }, 'Nao foi possivel salvar nome do cliente.');
    }
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: `Obrigado, ${incoming.text.trim()}. Agora me fala onde você vai usar: TV Smart, TV Box, Fire Stick, celular ou outro aparelho?`,
      logContext: { phone: incoming.phone, decision: 'name_saved' },
      stage: knowledgeBase.stages.waitingDevice,
      intent: 'captured_name'
    });
    return;
  }

  const intent = knowledgeBase.detectIntent(incoming.text);
  const action = knowledgeBase.actionForIntent(intent, customerStage);
  logger.info({ phone: incoming.phone, stage: customerStage }, 'STAGE_DETECTED');
  logger.info({ phone: incoming.phone, intent, action: action.type }, 'INTENT_DETECTED');

  let learnedAnswer = null;
  try {
    learnedAnswer = await supabase.findLearnedAnswer(incoming.text);
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone }, 'Nao foi possivel consultar learned_answers. Continuando atendimento.');
  }
  if (learnedAnswer) {
    logger.info({ phone: incoming.phone, learnedAnswerId: learnedAnswer.id }, 'LEARNED_ANSWER_CONTEXT');
  }

  if (action.type === 'send_values') {
    logger.info({ phone: incoming.phone, decision: 'send_values', intent }, 'DECISION');
    await sendValues({ whatsapp, to: incoming.replyTo, customerId: customer.id });
    await safeUpdateStage(customer.id, action.nextStage);
    return;
  }

  if (action.type === 'local_reply') {
    const localText = knowledgeBase.localFallbackForIntent(intent, customerStage);
    logger.info({ phone: incoming.phone, decision: 'local_action', intent, stage: customerStage }, 'LOCAL_ACTION_USED');
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: localText,
      logContext: { phone: incoming.phone, decision: 'local_action', intent },
      stage: action.nextStage,
      intent
    });
    await safeUpdateStage(customer.id, action.nextStage);
    if (action.needsArthur) {
      await sendQuestionToArthur({ customer, incoming, intent: { intent, stage: action.nextStage } });
    }
    return;
  }

  if (action.type === 'fake_or_request_test') {
    logger.info({ phone: incoming.phone, decision: config.testFakeMode ? 'fake_test' : 'request_real_test', intent }, 'DECISION');
    if (config.testFakeMode) {
      await sendFakeTestCredentials({ whatsapp, to: incoming.replyTo, customerId: customer.id });
      await safeUpdateStage(customer.id, action.nextStage);
      return;
    }

    await sendQuestionToArthur({ customer, incoming, intent: { intent, stage: customerStage } });
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: 'Perfeito. Vou iniciar a liberação do teste certinho.',
      logContext: { phone: incoming.phone, decision: 'request_real_test' },
      stage: knowledgeBase.stages.waitingLoginRelease,
      intent
    });
    return;
  }

  if (action.type === 'needs_arthur') {
    logger.info({ phone: incoming.phone, decision: 'needs_arthur', intent }, 'DECISION');
    await sendQuestionToArthur({ customer, incoming, intent: { intent, stage: customerStage } });
    await replyText({
      whatsapp,
      to: incoming.replyTo,
      customerId: customer.id,
      text: 'Certo, vou pausar o bot para atendimento humano por aqui.',
      logContext: { phone: incoming.phone, decision: 'needs_arthur' },
      stage: knowledgeBase.stages.human,
      intent
    });
    await safeUpdateStage(customer.id, knowledgeBase.stages.human);
    return;
  }

  let responseText;
  const conversationHistory = await supabase.getRecentMessages(customer.id, 10);
  const obsidianContext = obsidianKnowledge.getRelevantNotes(incoming.text);
  try {
    logger.info({ phone: incoming.phone, decision: 'ai_reply', intent }, 'DECISION');
    responseText = await kie.generateReply({
      customer: {
        ...customer,
        learnedAnswerContext: learnedAnswer?.answer || ''
      },
      messageText: incoming.text,
      conversationHistory,
      knowledgeBase,
      customerStage,
      intent,
      obsidianContext
    });
    logger.info({ phone: incoming.phone, intent }, 'AI_RESPONSE_CREATED');
    if (/verificar|arthur|passar certinho/i.test(responseText)) {
      await sendQuestionToArthur({ customer, incoming, intent: { intent, stage: customerStage } });
    }
  } catch (error) {
    logger.error({ err: error, phone: incoming.phone, intent }, 'Falha ao chamar KIE. Tentando IA local.');
    try {
      responseText = await localAi.generateReply({
        customer,
        messageText: incoming.text,
        conversationHistory,
        knowledgeBase,
        customerStage,
        intent,
        obsidianContext
      });
      logger.info({ phone: incoming.phone, intent }, 'LOCAL_AI_USED');
    } catch (localError) {
      logger.error({ err: localError, phone: incoming.phone, intent }, 'Falha na IA local.');
      const localFallback = knowledgeBase.localFallbackForIntent(intent, customerStage);
      logger.info({ phone: incoming.phone, intent }, localFallback === knowledgeBase.fallback ? 'FALLBACK_USED' : 'LOCAL_ACTION_USED');
      responseText = localFallback;
    }
  }

  await replyText({
    whatsapp,
    to: incoming.replyTo,
    customerId: customer.id,
    text: responseText,
    logContext: { phone: incoming.phone, decision: 'ai_reply', intent },
    stage: action.nextStage,
    intent
  });
  await safeUpdateStage(customer.id, action.nextStage);
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
        await safeUpdateStage(customer.id, knowledgeBase.stages.waitingContactSaved);
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
