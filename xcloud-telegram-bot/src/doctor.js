const fs = require('fs');
const { config, assertBaseConfig } = require('./config');
const { runValidationSuite } = require('./validations');

function check(name, ok, extra = '') {
  console.log(`${ok ? 'OK' : 'ERRO'} - ${name}${extra ? ` - ${extra}` : ''}`);
  if (!ok) process.exitCode = 1;
}

try {
  assertBaseConfig();
  check('TELEGRAM_BOT_TOKEN configurado', true);
} catch (err) {
  check('TELEGRAM_BOT_TOKEN configurado', false, err.message);
}

check('TELEGRAM_ALLOWED_USER_IDS recomendado', config.telegram.allowedIds.length > 0);
check('XCLOUD_EMAIL configurado', Boolean(config.xcloud.email));
check('XCLOUD_PASSWORD configurado', Boolean(config.xcloud.password));
check('Diretorio data acessivel', canCreateDir(config.dataDir), config.dataDir);
check('Diretorio de screenshots acessivel', canCreateDir(config.screenshotDir), config.screenshotDir);

for (const result of runValidationSuite()) {
  check(result.name, result.ok);
}

function canCreateDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (err) {
    return false;
  }
}
