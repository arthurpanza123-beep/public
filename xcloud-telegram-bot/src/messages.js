const { Markup } = require('telegraf');
const { devices, isAndroidDevice } = require('./apps');

const BTN_ACTIVATE = '\uD83D\uDE80 Ativar XCloud';
const BTN_ALT = '\uD83D\uDCFA App alternativo';

function mainMenu() {
  return Markup.keyboard([[BTN_ACTIVATE], [BTN_ALT]]).resize();
}

function deviceKeyboard() {
  return Markup.inlineKeyboard(
    devices.map((device) => [Markup.button.callback(device, `device:${device}`)])
  );
}

function appsKeyboard(apps) {
  const rows = [];
  for (let i = 0; i < apps.length; i += 2) {
    rows.push(
      apps.slice(i, i + 2).map((app) => Markup.button.callback(app.name, `app:${app.id}`))
    );
  }
  return Markup.inlineKeyboard(rows);
}

function cancelKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback('Cancelar operacao', 'cancel')]]);
}

function buildInstallMessage(app, device) {
  if (isAndroidDevice(device)) {
    return [
      'Vamos liberar seu teste por um aplicativo alternativo mais estavel para o seu aparelho.',
      '',
      'Por gentileza, instale o aplicativo Downloader no seu aparelho.',
      '',
      'Depois de abrir o Downloader, va ate a caixa de pesquisa/URL e digite o codigo abaixo:',
      '',
      app.downloader,
      '',
      `Em seguida, conclua a instalacao do ${app.name}.`,
      '',
      'Assim que instalar, me avise por aqui que eu ja te envio os dados de acesso para voce comecar o teste.'
    ].join('\n');
  }

  return [
    'Vamos liberar seu teste por um aplicativo alternativo mais estavel para sua TV.',
    '',
    `Por gentileza, instale o ${app.name} no aparelho.`,
    '',
    'Assim que instalar, me avise por aqui que eu ja te envio os dados de acesso e deixo tudo pronto para voce comecar o teste.'
  ].join('\n');
}

function buildAlternativeTestMessage(app, username, password) {
  return [
    '\u2705 Teste ativado com sucesso!',
    '',
    `Aplicativo: ${app.name}`,
    `Código do aplicativo: ${app.code}`,
    '',
    'Dados de acesso:',
    `Usuário: ${username}`,
    `Senha: ${password}`,
    '',
    'Entre no aplicativo com os dados acima para acessar seu teste.'
  ].join('\n');
}

function buildXcloudCustomerMessage() {
  return [
    '\u2705 Teste ativado com sucesso!',
    '',
    'Por gentileza, atualize o aplicativo clicando em Recarregar logo na tela inicial.',
    '',
    'Depois disso, confira se a lista de canais e conte\u00fados foi carregada corretamente.'
  ].join('\n');
}

function isMainActivate(text) {
  return String(text || '').trim() === BTN_ACTIVATE;
}

function isMainAlt(text) {
  return String(text || '').trim() === BTN_ALT;
}

module.exports = {
  BTN_ACTIVATE,
  BTN_ALT,
  mainMenu,
  deviceKeyboard,
  appsKeyboard,
  cancelKeyboard,
  buildInstallMessage,
  buildAlternativeTestMessage,
  buildXcloudCustomerMessage,
  isMainActivate,
  isMainAlt
};
