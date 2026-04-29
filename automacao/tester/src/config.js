const path = require('path');
const fs = require('fs');

const serviceRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(serviceRoot, '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });
const envBaseDir = fs.existsSync(path.join(projectRoot, '.env')) ? projectRoot : serviceRoot;

function resolveEnvPath(value, fallback) {
  if (value) return path.isAbsolute(value) ? value : path.resolve(envBaseDir, value);
  return path.resolve(serviceRoot, fallback);
}

function readInt(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBool(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

module.exports = {
  port: readInt('TESTER_PORT', 3002),
  commandToken: process.env.BOT_COMMAND_TOKEN || '',
  baseUrl: process.env.TEST_PANEL_URL || process.env.PANEL_BASE_URL || '',
  loginUrl: process.env.TEST_PANEL_LOGIN_URL || process.env.TEST_PANEL_URL || process.env.PANEL_LOGIN_URL || process.env.PANEL_BASE_URL || '',
  testUrl: process.env.TEST_PANEL_URL || process.env.PANEL_TEST_URL || process.env.PANEL_BASE_URL || '',
  username: process.env.TEST_PANEL_USER || process.env.PANEL_USERNAME || '',
  password: process.env.TEST_PANEL_PASSWORD || process.env.PANEL_PASSWORD || '',
  userDataDir: resolveEnvPath(process.env.PANEL_USER_DATA_DIR, path.join('storage', 'panel-profile')),
  errorsDir: resolveEnvPath(process.env.TESTER_ERRORS_DIR, 'errors'),
  headless: readBool('PLAYWRIGHT_HEADLESS', true),
  slowMoMs: readInt('PLAYWRIGHT_SLOW_MO_MS', 0),
  timeoutMs: readInt('PLAYWRIGHT_TIMEOUT_MS', 45000),
  logLevel: process.env.LOG_LEVEL || 'info',
  defaultProvider: process.env.TEST_PROVIDER || process.env.TEST_PROVIDER_NAME || '',
  defaultDurationHours: readInt('TEST_DEFAULT_DURATION_HOURS', 1),
  requireArthurApproval: readBool('TEST_REQUIRE_ARTHUR_APPROVAL', true),
  neverSendIfMissingFields: readBool('NEVER_SEND_TEST_IF_MISSING_FIELDS', true),
  selectors: {
    username: process.env.PANEL_USERNAME_SELECTOR || '',
    password: process.env.PANEL_PASSWORD_SELECTOR || '',
    loginButton: process.env.PANEL_LOGIN_BUTTON_SELECTOR || '',
    loggedInCheck: process.env.PANEL_LOGGED_IN_SELECTOR || '',
    newTestButton: process.env.PANEL_NEW_TEST_BUTTON_SELECTOR || '',
    name: process.env.PANEL_NAME_SELECTOR || '',
    phone: process.env.PANEL_PHONE_SELECTOR || '',
    duration: process.env.PANEL_DURATION_SELECTOR || '',
    durationValue: process.env.PANEL_DURATION_1H_VALUE || String(readInt('TEST_DEFAULT_DURATION_HOURS', 1)),
    submit: process.env.PANEL_SUBMIT_SELECTOR || '',
    successWait: process.env.PANEL_SUCCESS_WAIT_SELECTOR || '',
    provider: process.env.PANEL_RESULT_PROVIDER_SELECTOR || '',
    usernameResult: process.env.PANEL_RESULT_USERNAME_SELECTOR || '',
    passwordResult: process.env.PANEL_RESULT_PASSWORD_SELECTOR || '',
    expiresResult: process.env.PANEL_RESULT_EXPIRES_SELECTOR || ''
  }
};
