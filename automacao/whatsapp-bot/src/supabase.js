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

async function upsertCustomer({ phone, name }) {
  const data = await request(
    'post',
    'customers?on_conflict=phone',
    {
      phone,
      name: name || 'Cliente',
      last_message_at: new Date().toISOString()
    },
    'resolution=merge-duplicates,return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

async function saveMessage({ customerId, direction, body, mediaUrl = null, sentBy, pendingSend = false }) {
  if (!customerId) throw new Error('customer_id vazio ao salvar mensagem.');
  return request(
    'post',
    'messages',
    {
      customer_id: customerId,
      direction,
      body: body || '',
      media_url: mediaUrl,
      sent_by: sentBy,
      pending_send: pendingSend
    },
    'return=representation'
  );
}

async function markInitialFlowSent(customerId) {
  if (!customerId) throw new Error('customer_id vazio ao marcar fluxo inicial.');
  const data = await request(
    'patch',
    `customers?id=eq.${encodeURIComponent(customerId)}`,
    {
      flow_initial_sent: true,
      flow_initial_sent_at: new Date().toISOString(),
      status: 'ai_ready',
      last_message_at: new Date().toISOString()
    },
    'return=representation'
  );
  return Array.isArray(data) ? data[0] : data;
}

module.exports = {
  upsertCustomer,
  saveMessage,
  markInitialFlowSent
};
