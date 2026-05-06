const fs = require('fs');
const path = require('path');
const { config } = require('./config');

function now() {
  return new Date().toISOString();
}

function writeHistory(entry) {
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    const file = path.join(config.dataDir, 'history.jsonl');
    fs.appendFileSync(file, `${JSON.stringify({ at: now(), ...entry })}\n`);
  } catch (err) {
    console.error('[history] erro ao gravar:', err.message);
  }
}

function info(message, meta = {}) {
  console.log(`[${now()}] ${message}`, meta);
}

function error(message, err, meta = {}) {
  console.error(`[${now()}] ${message}`, err && err.stack ? err.stack : err, meta);
}

module.exports = { info, error, writeHistory };
