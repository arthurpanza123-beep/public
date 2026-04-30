const axios = require('axios');
const config = require('./config');

function requireConfig() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY precisam estar configurados.');
  }
}

function headers(prefer = 'return=representation') {
  return {
    apikey: config.supabaseServiceKey,
    Authorization: `Bearer ${config.supabaseServiceKey}`,
    'Content-Type': 'application/json',
    Prefer: prefer
  };
}

async function request(method, path, body, prefer) {
  requireConfig();
  const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`;
  const response = await axios({
    method,
    url,
    data: body,
    headers: headers(prefer),
    timeout: config.requestTimeoutMs
  });
  return response.data;
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function upsertCustomer({ phone, name }) {
  const data = await request(
    'post',
    'customers?on_conflict=phone',
    {
      phone,
      name: name || 'Cliente',
      status: 'bot',
      last_message_at: new Date().toISOString()
    },
    'resolution=merge-duplicates,return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

async function getCustomerByPhone(phone) {
  if (!phone) throw new Error('phone vazio ao buscar cliente.');
  const data = await request(
    'get',
    `customers?phone=eq.${encodeURIComponent(phone)}&select=*`,
    undefined,
    'return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

async function saveMessage({ customerId, direction, body, mediaUrl = null, sentBy, pendingSend = false }) {
  if (!customerId) throw new Error('customer_id vazio ao salvar mensagem.');
  const safeBody = String(body || mediaUrl || '[mensagem sem texto]');
  return request(
    'post',
    'messages',
    {
      customer_id: customerId,
      direction,
      body: safeBody,
      media_url: mediaUrl,
      sent_by: sentBy,
      pending_send: pendingSend
    },
    'return=representation'
  );
}

async function getRecentMessages(customerId, limit = 8) {
  if (!customerId) return [];
  const data = await request(
    'get',
    `messages?customer_id=eq.${encodeURIComponent(customerId)}&select=direction,body,sent_by,created_at&order=created_at.desc&limit=${limit}`,
    undefined,
    'return=representation'
  );
  return (Array.isArray(data) ? data : []).reverse();
}

async function markInitialFlowSent(customerId) {
  if (!customerId) throw new Error('customer_id vazio ao marcar fluxo inicial.');
  const data = await request(
    'patch',
    `customers?id=eq.${encodeURIComponent(customerId)}`,
    {
      flow_initial_sent: true,
      flow_initial_sent_at: new Date().toISOString(),
      status: 'bot',
      last_message_at: new Date().toISOString()
    },
    'return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

async function findLearnedAnswer(question) {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion) return null;

  const data = await request(
    'get',
    'learned_answers?approved=eq.true&select=*&order=created_at.desc&limit=100',
    undefined,
    'return=representation'
  );

  const answers = Array.isArray(data) ? data : [];
  return answers.find((item) => {
    const savedQuestion = normalizeText(item.question);
    return item.answer && (normalizedQuestion.includes(savedQuestion) || savedQuestion.includes(normalizedQuestion));
  }) || null;
}

async function saveUnknownQuestion({ question, tags = [] }) {
  if (!question) return null;
  const data = await request(
    'post',
    'learned_answers',
    {
      question,
      answer: '',
      tags,
      approved: false
    },
    'return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

async function saveBotEvent({ customerId = null, phone = '', event, payload = {} }) {
  const data = await request(
    'post',
    'bot_events',
    {
      customer_id: customerId,
      phone,
      event,
      payload
    },
    'return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

module.exports = {
  upsertCustomer,
  getCustomerByPhone,
  saveMessage,
  getRecentMessages,
  markInitialFlowSent,
  findLearnedAnswer,
  saveUnknownQuestion,
  saveBotEvent
};
