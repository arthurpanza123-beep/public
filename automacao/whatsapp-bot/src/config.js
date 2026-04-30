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

function readSecondsAsMs(name, fallbackMs) {
  const value = process.env[name];
  if (!value) return fallbackMs;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 1000)) : fallbackMs;
}

module.exports = {
  port: readInt('PORT', 3333),
  botName: process.env.WHATSAPP_BOT_NAME || 'Primeflix Bot',
  commandToken: process.env.BOT_COMMAND_TOKEN || '',
  useN8n: readBool('USE_N8N', false),
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
  n8nWebhookToken: process.env.N8N_WEBHOOK_TOKEN || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  kieBaseUrl: process.env.KIE_BASE_URL || 'https://api.kie.ai',
  kieChatEndpoint: process.env.KIE_CHAT_ENDPOINT || '/claude/v1/messages',
  kieApiUrl: process.env.KIE_API_URL || '',
  kieApiKey: process.env.KIE_API_KEY || '',
  kieModel: process.env.KIE_MODEL || 'claude-haiku-4-5',
  kieMaxTokens: readInt('KIE_MAX_TOKENS', 500),
  kieTimeoutMs: readInt('KIE_TIMEOUT_MS', 60000),
  kieAnthropicVersion: process.env.KIE_ANTHROPIC_VERSION || '2023-06-01',
  testFakeMode: readBool('TEST_FAKE_MODE', false),
  testFakeProvider: process.env.TEST_FAKE_PROVIDER || 'primeflixapp',
  testFakeUser: process.env.TEST_FAKE_USER || 'teste.primeflix',
  testFakePassword: process.env.TEST_FAKE_PASSWORD || '123456',
  localAiEnabled: readBool('LOCAL_AI_ENABLED', false),
  localAiBaseUrl: process.env.LOCAL_AI_BASE_URL || 'http://ollama:11434',
  localAiModel: process.env.LOCAL_AI_MODEL || 'llama3.2:3b',
  localAiTimeoutMs: readInt('LOCAL_AI_TIMEOUT_MS', 60000),
  obsidianKbDir: resolveEnvPath(process.env.OBSIDIAN_KB_DIR, 'knowledge/obsidian'),
  obsidianMaxSnippets: readInt('OBSIDIAN_MAX_SNIPPETS', 4),
  sessionDir: resolveEnvPath(process.env.WHATSAPP_SESSION_DIR, 'sessions'),
  materialDir: resolveEnvPath(process.env.MATERIAL_DIR, 'material'),
  audio01: process.env.AUDIO_01 || 'apresentacao01.ogg',
  audio02: process.env.AUDIO_02 || 'apresentacao02.ogg',
  audio03: process.env.AUDIO_03 || 'qualatv.ogg',
  audioRenovacao: process.env.AUDIO_RENOVACAO || 'renovacao.ogg',
  imageFeedbacks: process.env.IMAGE_FEEDBACKS || 'feedbaks.jpeg',
  imageValores: process.env.IMAGE_VALORES || 'valor.jpeg',
  imageBlack: process.env.IMAGE_BLACK || 'black.jpeg',
  feedbacksCaption: process.env.IMAGE_FEEDBACKS_CAPTION || '👆🏼 Esses são alguns dos nossos 800 clientes que fez o teste do nosso servidor e se tornaram clientes fiéis, pela qualidade, suporte e diferença absurda de qualquer outro servidor do mercado!',
  valuesCaption: process.env.IMAGE_VALORES_CAPTION || '',
  forwardFromMe: readBool('WHATSAPP_FORWARD_FROM_ME', false),
  ignoreGroups: readBool('WHATSAPP_IGNORE_GROUPS', true),
  requestTimeoutMs: readInt('WHATSAPP_REQUEST_TIMEOUT_MS', 10000),
  defaultTypingMs: readSecondsAsMs('TYPING_DELAY_SECONDS', 3000),
  defaultRecordingMs: readSecondsAsMs('RECORDING_DELAY_SECONDS', 6000),
  defaultDelayMs: readInt('WHATSAPP_DEFAULT_DELAY_MS', 800),
  initialFlowDelayMs: readSecondsAsMs('INITIAL_FLOW_DELAY_SECONDS', 3000),
  useRandomDelays: readBool('USE_RANDOM_DELAYS', true),
  audioMimetype: process.env.WHATSAPP_AUDIO_MIMETYPE || 'audio/ogg; codecs=opus',
  logLevel: process.env.LOG_LEVEL || 'info'
};
