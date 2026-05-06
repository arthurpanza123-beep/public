const path = require('path');
let dotenv;

try {
  dotenv = require('dotenv');
} catch (err) {
  dotenv = { config: () => ({}) };
}

dotenv.config();

function bool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'sim', 'on'].includes(String(value).trim().toLowerCase());
}

function int(value, defaultValue = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function splitIds(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(rootDir, 'data');
const storageDir = path.resolve(rootDir, process.env.STORAGE_DIR || 'storage');

const config = {
  rootDir,
  dataDir,
  storageDir,
  screenshotDir: path.resolve(
    rootDir,
    process.env.SCREENSHOT_DIR || path.join(process.env.STORAGE_DIR || 'storage', 'screenshots')
  ),
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedIds: splitIds(process.env.TELEGRAM_ALLOWED_USER_IDS || process.env.TELEGRAM_ALLOWED_IDS)
  },
  xcloud: {
    email: process.env.XCLOUD_EMAIL || '',
    password: process.env.XCLOUD_PASSWORD || '',
    panelUrl: process.env.XCLOUD_PANEL_URL || 'https://panel.xtream.cloud',
    customPlaylistUrl:
      process.env.XCLOUD_CUSTOM_PLAYLIST_URL ||
      'https://xtream.cloud/custom-playlist?device_key={DEVICE_KEY}&type=playlist&mode=add',
    profileDir: path.resolve(rootDir, process.env.XCLOUD_PROFILE_DIR || '.xcloud-profile'),
    headless: bool(process.env.HEADLESS, true),
    slowMoMs: int(process.env.SLOW_MO_MS, 0),
    selectors: {
      deviceKey: process.env.XCLOUD_DEVICE_KEY_SELECTOR || '',
      playlistUrl: process.env.XCLOUD_PLAYLIST_URL_SELECTOR || '',
      save: process.env.XCLOUD_SAVE_SELECTOR || '',
      addDevice: process.env.XCLOUD_ADD_DEVICE_SELECTOR || '',
      devicesMenu: process.env.XCLOUD_DEVICES_MENU_SELECTOR || '',
      ownPlaylist: process.env.XCLOUD_OWN_PLAYLIST_SELECTOR || ''
    }
  }
};

function assertBaseConfig() {
  if (!config.telegram.token) {
    throw new Error('TELEGRAM_BOT_TOKEN nao foi configurado no .env');
  }
}

function assertXcloudConfig() {
  const missing = [];
  if (!config.xcloud.email) missing.push('XCLOUD_EMAIL');
  if (!config.xcloud.password) missing.push('XCLOUD_PASSWORD');
  if (missing.length) {
    throw new Error(`Campos ausentes no .env: ${missing.join(', ')}`);
  }
}

module.exports = { config, assertBaseConfig, assertXcloudConfig };
