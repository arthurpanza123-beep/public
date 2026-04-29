const express = require('express');
const config = require('./config');
const logger = require('./logger');
const panelTester = require('./panelTester');

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
    logger.warn('BOT_COMMAND_TOKEN nao configurado. Endpoints do tester estao sem token.');
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

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'tester',
    panelConfigured: Boolean(config.testUrl),
    headless: config.headless
  });
});

app.post('/tests', requireCommandToken, asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (config.requireArthurApproval && body.approvedByArthur !== true) {
    return res.status(409).json({
      ok: false,
      code: 'ARTHUR_APPROVAL_REQUIRED',
      message: 'Teste nao criado. Aprovacao de Arthur e obrigatoria.'
    });
  }

  const result = await panelTester.createTrial(body);
  const status = result.ok ? 200 : 502;
  res.status(status).json(result);
}));

app.use((error, req, res, next) => {
  logger.error({ err: error, path: req.path }, 'Erro no endpoint do tester.');
  res.status(500).json({
    ok: false,
    code: error.code || 'TESTER_ENDPOINT_FAILED',
    message: 'Falha segura no tester. Avise Arthur e nao envie nada ao cliente.'
  });
});

module.exports = app;
