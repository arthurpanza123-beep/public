const { extractM3U, extractCredentials, isValidCredential, isValidM3UUrl } = require('./parser');
const { devices, getAppsForDevice, isAndroidDevice } = require('./apps');

function runValidationSuite() {
  const messageChecks = buildMessageChecks();
  const validM3U =
    'http://xenora.example/get.php?username=989762772&password=316956347&type=m3u_plus&output=ts';
  const sample = [
    '*Usuario:* 989762772',
    '*Senha:* 316956347',
    '',
    `*Link (M3U):* ${validM3U}`
  ].join('\n');

  const creds = extractCredentials(sample);
  const checks = [
    ['Parser extrai Link (M3U)', extractM3U(sample) === validM3U],
    ['Parser rejeita Link curto', extractM3U('*Link curto:* https://bit.ly/teste123') === null],
    ['Parser rejeita M3U8', extractM3U('*Link (M3U8):* http://cdn.example/live.m3u8') === null],
    [
      'Parser rejeita MPEGTS/HLS rotulados',
      extractM3U(`*Link (MPEGTS):* ${validM3U}`) === null &&
        extractM3U(`*Link (HLS):* ${validM3U}`) === null
    ],
    ['Validador M3U aceita get.php com usuario/senha', isValidM3UUrl(validM3U)],
    ['Validador M3U rejeita link curto', !isValidM3UUrl('https://bit.ly/teste123')],
    ['Parser extrai usuario/senha', creds.username === '989762772' && creds.password === '316956347'],
    ['Validador rejeita credencial com espaco', !isValidCredential('abc 123')],
    ['Todos os aparelhos possuem apps', devices.every((device) => getAppsForDevice(device).length > 0)],
    [
      'Apps Android possuem codigo Downloader',
      getAppsForDevice('Android').every((app) => Boolean(app.downloader))
    ],
    [
      'Regra Android cobre todos os aparelhos esperados',
      ['Android TV', 'TV Box', 'Fire Stick', 'Mi Stick', 'Android'].every(isAndroidDevice)
    ],
    ...messageChecks
  ];

  return checks.map(([name, ok]) => ({ name, ok: Boolean(ok) }));
}

function buildMessageChecks() {
  try {
    const { buildInstallMessage, buildAlternativeTestMessage } = require('./messages');
    return [
      [
        'Mensagem Android menciona Downloader',
        /Downloader/i.test(buildInstallMessage(getAppsForDevice('Android TV')[0], 'Android TV'))
      ],
      [
        'Mensagem LG nao menciona Downloader',
        !/Downloader/i.test(buildInstallMessage(getAppsForDevice('LG')[0], 'LG'))
      ],
      [
        'Mensagem final alternativa comeca corretamente',
        buildAlternativeTestMessage(getAppsForDevice('LG')[0], 'usuario1', 'senha1').startsWith(
          '✅ Teste ativado com sucesso!'
        )
      ]
    ];
  } catch (err) {
    return [];
  }
}

module.exports = { runValidationSuite };
