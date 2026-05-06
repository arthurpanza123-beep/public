const fs = require('fs');
const path = require('path');
const { config } = require('./config');

class StateStore {
  constructor() {
    this.file = path.join(config.dataDir, 'state.json');
    this.data = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return {};
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (err) {
      console.error('[state] nao foi possivel ler state.json:', err.message);
      return {};
    }
  }

  save() {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  get(chatId) {
    return this.data[String(chatId)] || null;
  }

  set(chatId, state) {
    this.data[String(chatId)] = {
      ...state,
      updatedAt: new Date().toISOString()
    };
    this.save();
  }

  patch(chatId, patch) {
    const current = this.get(chatId) || {};
    this.set(chatId, { ...current, ...patch });
  }

  clear(chatId) {
    delete this.data[String(chatId)];
    this.save();
  }
}

module.exports = { StateStore };
