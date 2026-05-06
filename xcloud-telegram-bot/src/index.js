const fs = require('fs');
const { Telegraf } = require('telegraf');
const { config, assertBaseConfig } = require('./config');
const { StateStore } = require('./state');
const { XcloudAutomation } = require('./xcloud');
const { devices, getAppsForDevice, getAppById, supportsDevice } = require('./apps');
const { extractM3U, extractCredentials, looksLikeDeviceKey } = require('./parser');
const {
  mainMenu,
  deviceKeyboard,
  appsKeyboard,
  cancelKeyboard,
  buildInstallMessage,
  buildAlternativeTestMessage,
  buildXcloudCustomerMessage,
  isMainActivate,
  isMainAlt
} = require('./messages');
const { info, error, writeHistory } = require('./logger');

assertBaseConfig();

const bot = new Telegraf(config.telegram.token);
const store = new StateStore();
const xcloud = new XcloudAutomation();

function isAllowed(ctx) {
  if (!config.telegram.allowedIds.length) return true;
  const id = ctx.from && ctx.from.id ? String(ctx.from.id) : '';
  return config.telegram.allowedIds.includes(id);
}

function sessionKey(ctx) {
  const chatId = ctx.chat && ctx.chat.id ? String(ctx.chat.id) : 'unknown-chat';
  const userId = ctx.from && ctx.from.id ? String(ctx.from.id) : chatId;
  return `${chatId}:${userId}`;
}

async function guard(ctx, next) {
  if (!isAllowed(ctx)) {
    await ctx.reply('Acesso nao autorizado.');
    return;
  }
  await next();
}

bot.use(guard);

bot.start(async (ctx) => {
  store.clear(sessionKey(ctx));
  await ctx.reply('Bot XCloud pronto. Escolha uma opcao:', mainMenu());
});

bot.command('menu', async (ctx) => {
  store.clear(sessionKey(ctx));
  await ctx.reply('Menu principal:', mainMenu());
});

bot.command('cancelar', async (ctx) => {
  store.clear(sessionKey(ctx));
  await ctx.reply('Operacao cancelada.', mainMenu());
});

bot.command('status', async (ctx) => {
  const state = store.get(sessionKey(ctx));
  await ctx.reply(
    [
      'Status do bot:',
      `Estado atual: ${state ? state.step : 'livre'}`,
      `Headless: ${config.xcloud.headless}`,
      `Perfil XCloud: ${config.xcloud.profileDir}`
    ].join('\n'),
    mainMenu()
  );
});

bot.command('ativar', async (ctx) => {
  const text = ctx.message.text.replace(/^\/ativar\s*/i, '').trim();
  if (!text) {
    store.set(sessionKey(ctx), { flow: 'xcloud', step: 'xcloud_wait_key' });
    await ctx.reply('Me envie a chave do dispositivo que aparece na TV do cliente.', cancelKeyboard());
    return;
  }
  await handleDeviceKey(ctx, text);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  const sessionId = sessionKey(ctx);
  const state = store.get(sessionId);

  if (isMainActivate(text)) {
    store.set(sessionId, { flow: 'xcloud', step: 'xcloud_wait_key' });
    await ctx.reply('Me envie a chave do dispositivo que aparece na TV do cliente.', cancelKeyboard());
    return;
  }

  if (isMainAlt(text)) {
    store.set(sessionId, { flow: 'alternative', step: 'alt_wait_device' });
    await ctx.reply('Qual e a TV ou aparelho do cliente?', deviceKeyboard());
    return;
  }

  if (!state) {
    await ctx.reply('Escolha uma opcao no menu principal:', mainMenu());
    return;
  }

  if (state.step === 'xcloud_wait_key') {
    await handleDeviceKey(ctx, text);
    return;
  }

  if (state.step === 'xcloud_wait_test_text') {
    await handleXcloudM3U(ctx, text, state);
    return;
  }

  if (state.step === 'alt_wait_test_text') {
    await handleAlternativeCredentials(ctx, text, state);
    return;
  }

  await ctx.reply('Nao entendi essa etapa. Use /cancelar para reiniciar.', mainMenu());
});

bot.action('cancel', async (ctx) => {
  store.clear(sessionKey(ctx));
  await ctx.answerCbQuery('Cancelado');
  await ctx.reply('Operacao cancelada.', mainMenu());
});

bot.action(/^device:(.+)$/i, async (ctx) => {
  const sessionId = sessionKey(ctx);
  const state = store.get(sessionId);
  const device = ctx.match[1];
  if (!devices.includes(device)) {
    await ctx.answerCbQuery('Aparelho invalido');
    return;
  }

  if (!state || state.flow !== 'alternative' || state.step !== 'alt_wait_device') {
    await ctx.answerCbQuery('Fluxo expirado');
    await ctx.reply('Fluxo expirado. Clique em App alternativo novamente.', mainMenu());
    store.clear(sessionId);
    return;
  }

  const apps = getAppsForDevice(device);
  store.set(sessionId, { flow: 'alternative', step: 'alt_wait_app', device });
  await ctx.answerCbQuery(device);

  if (!apps.length) {
    await ctx.reply('Nao encontrei apps cadastrados para esse aparelho.');
    return;
  }

  await ctx.reply(`Apps disponiveis para ${device}:`, appsKeyboard(apps));
});

bot.action(/^app:(.+)$/i, async (ctx) => {
  const appId = ctx.match[1];
  const sessionId = sessionKey(ctx);
  const state = store.get(sessionId);
  const app = getAppById(appId);

  if (!state || state.step !== 'alt_wait_app' || !state.device || !app || !supportsDevice(app, state.device)) {
    await ctx.answerCbQuery('Fluxo expirado');
    await ctx.reply('Fluxo expirado. Clique em App alternativo novamente.', mainMenu());
    store.clear(sessionId);
    return;
  }

  await ctx.answerCbQuery(app.name);
  store.set(sessionId, {
    flow: 'alternative',
    step: 'alt_wait_test_text',
    device: state.device,
    appId: app.id
  });

  await ctx.reply('Mensagem para pedir instalacao ao cliente:');
  await ctx.reply(buildInstallMessage(app, state.device));
  await ctx.reply('Depois que o cliente instalar, me envie o texto completo do teste para eu extrair usuario e senha.', cancelKeyboard());
});

async function handleDeviceKey(ctx, key) {
  const sessionId = sessionKey(ctx);
  const deviceKey = key.trim();

  if (!looksLikeDeviceKey(deviceKey)) {
    await ctx.reply('Essa chave parece invalida. Envie somente a chave do dispositivo, sem espacos e sem texto extra.', cancelKeyboard());
    return;
  }

  store.set(sessionId, { flow: 'xcloud', step: 'xcloud_activating', deviceKey });
  await ctx.reply(`Recebi a chave: ${deviceKey}\nVou ativar o dispositivo no XCloud.`);

  try {
    await xcloud.addDevice(deviceKey);
    store.set(sessionId, { flow: 'xcloud', step: 'xcloud_wait_test_text', deviceKey });
    writeHistory({ type: 'xcloud_device_saved', chatId: ctx.chat.id, userId: ctx.from.id, deviceKey });
    await ctx.reply('Dispositivo salvo no XCloud. Agora me envie o texto completo do teste ou apenas o Link M3U.', cancelKeyboard());
  } catch (err) {
    store.set(sessionId, { flow: 'xcloud', step: 'xcloud_wait_key' });
    await replyAutomationError(ctx, err, 'Nao consegui salvar o dispositivo no XCloud.');
  }
}

async function handleXcloudM3U(ctx, text, state) {
  const sessionId = sessionKey(ctx);
  const m3u = extractM3U(text);

  if (!m3u) {
    await ctx.reply('Nao encontrei o Link (M3U). Envie o texto completo do teste ou a URL M3U direta.', cancelKeyboard());
    return;
  }

  await ctx.reply('M3U encontrado. Vou configurar a playlist no XCloud.');

  try {
    await xcloud.configurePlaylist(state.deviceKey, m3u);
    store.clear(sessionId);
    writeHistory({ type: 'xcloud_playlist_saved', chatId: ctx.chat.id, userId: ctx.from.id, deviceKey: state.deviceKey });

    await ctx.reply('\u2705 Dispositivo ativado com sucesso!\n\nMensagem para enviar ao cliente:');
    await ctx.reply(buildXcloudCustomerMessage(), mainMenu());
  } catch (err) {
    await replyAutomationError(ctx, err, 'Nao consegui configurar a playlist M3U no XCloud.');
  }
}

async function handleAlternativeCredentials(ctx, text, state) {
  const app = getAppById(state.appId);
  if (!app) {
    store.clear(sessionKey(ctx));
    await ctx.reply('App nao encontrado. Clique em App alternativo novamente.', mainMenu());
    return;
  }

  const { username, password } = extractCredentials(text);
  if (!username || !password) {
    await ctx.reply('Nao consegui encontrar usuario e senha. Envie o texto completo do teste novamente.', cancelKeyboard());
    return;
  }

  store.clear(sessionKey(ctx));
  writeHistory({ type: 'alternative_test_generated', chatId: ctx.chat.id, userId: ctx.from.id, app: app.name, username });
  await ctx.reply('Mensagem para enviar ao cliente:');
  await ctx.reply(buildAlternativeTestMessage(app, username, password), mainMenu());
}

async function replyAutomationError(ctx, err, headline) {
  error(headline, err);
  await ctx.reply(
    [
      headline,
      '',
      `Erro: ${err.message || String(err)}`,
      '',
      'Se aparecer print abaixo, use ele para ajustar o seletor ou mandar para o Codex corrigir.'
    ].join('\n'),
    mainMenu()
  );

  if (err.screenshotPath && fs.existsSync(err.screenshotPath)) {
    await ctx.replyWithPhoto({ source: err.screenshotPath }).catch(() => null);
  }
}

bot.catch((err, ctx) => {
  error('Erro global do bot', err, { updateType: ctx && ctx.updateType });
});

process.once('SIGINT', async () => {
  await xcloud.close().catch(() => null);
  bot.stop('SIGINT');
});

process.once('SIGTERM', async () => {
  await xcloud.close().catch(() => null);
  bot.stop('SIGTERM');
});

bot.launch().then(() => {
  info('Bot XCloud iniciado');
});
