const express = require('express');
const config = require('./config');
const logger = require('./logger');
const whatsapp = require('./whatsapp');

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function requireCommandToken(req, res, next) {
  if (!config.commandToken) {
    logger.warn('BOT_COMMAND_TOKEN nao configurado. Endpoints de comando estao sem token.');
    return next();
  }

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : req.get('x-command-token');

  if (token !== config.commandToken) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }

  next();
}

function serializeResult(result) {
  return {
    messageId: result?.key?.id || null,
    jid: result?.key?.remoteJid || null
  };
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'whatsapp-bot', whatsapp: whatsapp.getStatus() });
});

app.get('/status', requireCommandToken, (req, res) => {
  res.json({ ok: true, whatsapp: whatsapp.getStatus() });
});

app.get('/qr', requireCommandToken, (req, res) => {
  res.json({ ok: true, qr: whatsapp.lastQr || null });
});

app.post('/send/text', requireCommandToken, asyncHandler(async (req, res) => {
  const result = await whatsapp.sendText(req.body || {});
  res.json({ ok: true, result: serializeResult(result) });
}));

app.post('/send/audio', requireCommandToken, asyncHandler(async (req, res) => {
  const result = await whatsapp.sendAudio(req.body || {});
  res.json({ ok: true, result: serializeResult(result) });
}));

app.post('/send/image', requireCommandToken, asyncHandler(async (req, res) => {
  const result = await whatsapp.sendImage(req.body || {});
  res.json({ ok: true, result: serializeResult(result) });
}));

app.post('/presence', requireCommandToken, asyncHandler(async (req, res) => {
  const result = await whatsapp.sendPresence(req.body.to, req.body.presence || req.body.type, req.body.durationMs || 0);
  res.json({ ok: true, result });
}));

app.post('/presence/composing', requireCommandToken, asyncHandler(async (req, res) => {
  const durationMs = req.body.durationMs ?? Number(req.body.durationSeconds || 0) * 1000;
  const result = await whatsapp.sendPresence(req.body.to, 'composing', durationMs || config.defaultTypingMs);
  res.json({ ok: true, result });
}));

app.post('/presence/recording', requireCommandToken, asyncHandler(async (req, res) => {
  const durationMs = req.body.durationMs ?? Number(req.body.durationSeconds || 0) * 1000;
  const result = await whatsapp.sendPresence(req.body.to, 'recording', durationMs || config.defaultRecordingMs);
  res.json({ ok: true, result });
}));

app.post('/presence/paused', requireCommandToken, asyncHandler(async (req, res) => {
  const result = await whatsapp.sendPresence(req.body.to, 'paused', 0);
  res.json({ ok: true, result });
}));

app.post('/internal/arthur-message', requireCommandToken, asyncHandler(async (req, res) => {
  const { to, text } = req.body || {};
  const result = await whatsapp.sendText({ to, text, simulateTyping: false });
  res.json({ ok: true, result: serializeResult(result), sender: 'arthur' });
}));

app.post('/send/commands', requireCommandToken, asyncHandler(async (req, res) => {
  const { to, commands } = req.body || {};
  if (!to) return res.status(400).json({ ok: false, error: 'MISSING_TO' });
  if (!Array.isArray(commands) || commands.length === 0) {
    return res.status(400).json({ ok: false, error: 'MISSING_COMMANDS' });
  }

  const results = [];
  for (const command of commands) {
    const result = await whatsapp.executeCommand({ ...command, to: command.to || to });
    results.push(serializeResult(result));
  }

  res.json({ ok: true, results });
}));

app.use((error, req, res, next) => {
  logger.error({ err: error, path: req.path }, 'Erro no endpoint do WhatsApp.');
  res.status(500).json({
    ok: false,
    error: 'WHATSAPP_COMMAND_FAILED',
    message: error.message
  });
});

module.exports = app;
