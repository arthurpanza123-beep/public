const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys');
const config = require('./config');
const logger = require('./logger');
const { normalizePhone, toJid } = require('./phone');
const botService = require('./botService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterDelay(ms) {
  if (!config.useRandomDelays || !ms) return ms;
  const min = Math.round(ms * 0.75);
  const max = Math.round(ms * 1.25);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function unwrapMessage(message) {
  if (!message) return {};
  if (message.ephemeralMessage?.message) return unwrapMessage(message.ephemeralMessage.message);
  if (message.viewOnceMessage?.message) return unwrapMessage(message.viewOnceMessage.message);
  if (message.viewOnceMessageV2?.message) return unwrapMessage(message.viewOnceMessageV2.message);
  if (message.documentWithCaptionMessage?.message) return unwrapMessage(message.documentWithCaptionMessage.message);
  return message;
}

function extractIncomingMessage(message) {
  const content = unwrapMessage(message);

  if (content.conversation) {
    return { type: 'text', text: content.conversation };
  }

  if (content.extendedTextMessage?.text) {
    return { type: 'text', text: content.extendedTextMessage.text };
  }

  if (content.imageMessage) {
    return { type: 'image', text: content.imageMessage.caption || '', media: true };
  }

  if (content.videoMessage) {
    return { type: 'video', text: content.videoMessage.caption || '', media: true };
  }

  if (content.audioMessage) {
    return { type: 'audio', text: '', media: true, ptt: Boolean(content.audioMessage.ptt) };
  }

  if (content.documentMessage) {
    return {
      type: 'document',
      text: content.documentMessage.caption || content.documentMessage.fileName || '',
      media: true
    };
  }

  if (content.buttonsResponseMessage) {
    return {
      type: 'button',
      text: content.buttonsResponseMessage.selectedDisplayText || content.buttonsResponseMessage.selectedButtonId || ''
    };
  }

  if (content.listResponseMessage) {
    const row = content.listResponseMessage.singleSelectReply?.selectedRowId || '';
    return {
      type: 'list',
      text: content.listResponseMessage.title || row
    };
  }

  return { type: 'unknown', text: '' };
}

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.connected = false;
    this.starting = false;
    this.lastQr = null;
  }

  async start() {
    if (this.sock || this.starting) return;

    this.starting = true;
    fs.mkdirSync(config.sessionDir, { recursive: true });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.macOS(config.botName),
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
      this.sock.ev.on('messages.upsert', (event) => this.handleMessages(event));

      logger.info({ version }, 'WhatsApp iniciado. Aguarde QR ou conexao aberta.');
    } finally {
      this.starting = false;
    }
  }

  handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.lastQr = qr;
      logger.info('QR Code recebido. Escaneie no terminal para conectar o WhatsApp.');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      this.connected = true;
      this.lastQr = null;
      logger.info('WhatsApp conectado.');
    }

    if (connection === 'close') {
      this.connected = false;
      this.sock = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode, shouldReconnect }, 'Conexao WhatsApp fechada.');

      if (shouldReconnect) {
        setTimeout(() => this.start().catch((error) => {
          logger.error({ err: error }, 'Falha ao reconectar WhatsApp.');
        }), 3000);
      }
    }
  }

  async handleMessages(event) {
    if (!Array.isArray(event.messages)) return;

    for (const message of event.messages) {
      try {
        await this.processIncomingMessage(message);
      } catch (error) {
        logger.error({ err: error, messageId: message?.key?.id }, 'Falha ao processar mensagem recebida.');
      }
    }
  }

  buildIncomingPayload(message) {
    if (!message?.message || !message.key?.remoteJid) return;
    const jid = message.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const fromMe = Boolean(message.key.fromMe);

    const extracted = extractIncomingMessage(message.message);
    return {
      source: 'whatsapp-bot',
      event: 'message.received',
      messageId: message.key.id,
      jid,
      phone: normalizePhone(message.key.senderPn) || normalizePhone(jid),
      fromMe,
      isGroup,
      pushName: message.pushName || '',
      timestamp: Number(message.messageTimestamp || Date.now()),
      message: extracted,
      raw: {
        key: message.key
      }
    };
  }

  async processIncomingMessage(message) {
    const payload = this.buildIncomingPayload(message);
    if (!payload) return;

    if (payload.isGroup && config.ignoreGroups) return;
    if (payload.fromMe && !config.forwardFromMe) return;

    if (config.useN8n) {
      await this.forwardIncomingMessage(payload).catch((error) => {
        logger.error({ err: error, phone: payload.phone }, 'Falha ao encaminhar evento opcional ao n8n.');
      });
      return;
    }

    await botService.processIncomingMessage(payload, this);
  }

  async forwardIncomingMessage(payload) {
    if (!config.n8nWebhookUrl) {
      logger.warn('USE_N8N=true, mas N8N_WEBHOOK_URL nao esta configurado.');
      return;
    }

    const headers = { 'X-primeflix-Source': 'whatsapp-bot' };
    if (config.n8nWebhookToken) {
      headers.Authorization = `Bearer ${config.n8nWebhookToken}`;
    }

    await axios.post(config.n8nWebhookUrl, payload, {
      timeout: config.requestTimeoutMs,
      headers
    });

    logger.info({ phone: payload.phone, type: payload.message?.type }, 'Mensagem encaminhada ao n8n.');
  }

  requireConnection() {
    if (!this.sock || !this.connected) {
      throw new Error('WhatsApp ainda nao esta conectado.');
    }
  }

  resolveMaterialFile(fileName) {
    if (!fileName) throw new Error('Nome do arquivo de midia ausente.');
    const materialDir = path.resolve(config.materialDir);
    const candidate = path.resolve(materialDir, fileName);
    const allowedPrefix = `${materialDir}${path.sep}`;

    if (candidate !== materialDir && !candidate.startsWith(allowedPrefix)) {
      throw new Error('Arquivo fora da pasta material.');
    }

    if (!fs.existsSync(candidate)) {
      throw new Error(`Arquivo de midia nao encontrado: ${fileName}`);
    }

    return candidate;
  }

  async sendPresence(to, presence, durationMs = 0) {
    this.requireConnection();
    const jid = toJid(to);
    const states = {
      typing: 'composing',
      composing: 'composing',
      recording: 'recording',
      paused: 'paused',
      available: 'available',
      unavailable: 'unavailable'
    };
    const state = states[presence] || presence;

    await this.sock.presenceSubscribe(jid).catch(() => {});
    await this.sock.sendPresenceUpdate(state, jid);

    const finalDurationMs = jitterDelay(durationMs);
    if (finalDurationMs > 0 && state !== 'paused') {
      await sleep(finalDurationMs);
      await this.sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }

    return { jid, presence: state };
  }

  async sendText({ to, text, simulateTyping = true, delayMs }) {
    this.requireConnection();
    if (!text) throw new Error('Texto ausente.');
    const jid = toJid(to);

    if (simulateTyping) {
      await this.sendPresence(jid, 'typing', delayMs ?? config.defaultTypingMs);
    }

    const result = await this.sock.sendMessage(jid, { text });
    logger.info({ jid }, 'Texto enviado.');
    return result;
  }

  async sendAudio({ to, fileName, ptt = true, simulateRecording = true, delayMs }) {
    this.requireConnection();
    const jid = toJid(to);
    const filePath = this.resolveMaterialFile(fileName);

    if (simulateRecording) {
      await this.sendPresence(jid, 'recording', delayMs ?? config.defaultRecordingMs);
    }

    const result = await this.sock.sendMessage(jid, {
      audio: { url: filePath },
      mimetype: config.audioMimetype,
      ptt: Boolean(ptt)
    });

    logger.info({ jid, fileName }, 'Audio enviado.');
    return result;
  }

  async sendImage({ to, fileName, caption = '', simulateTyping = true, delayMs }) {
    this.requireConnection();
    const jid = toJid(to);
    const filePath = this.resolveMaterialFile(fileName);

    if (simulateTyping && caption) {
      await this.sendPresence(jid, 'typing', delayMs ?? config.defaultTypingMs);
    }

    const result = await this.sock.sendMessage(jid, {
      image: { url: filePath },
      caption
    });

    logger.info({ jid, fileName }, 'Imagem enviada.');
    return result;
  }

  async executeCommand(command) {
    const type = command?.type;

    if (type === 'delay') {
      await sleep(jitterDelay(command.durationMs ?? config.defaultDelayMs));
      return { ok: true, type };
    }

    if (type === 'presence') {
      return this.sendPresence(command.to, command.presence || command.state || 'typing', command.durationMs || 0);
    }

    if (type === 'text') return this.sendText(command);
    if (type === 'audio') return this.sendAudio(command);
    if (type === 'image') return this.sendImage(command);

    throw new Error(`Tipo de comando desconhecido: ${type}`);
  }

  getStatus() {
    return {
      connected: this.connected,
      hasQr: Boolean(this.lastQr),
      sessionDir: config.sessionDir,
      materialDir: config.materialDir
    };
  }
}

module.exports = new WhatsAppClient();
