function normalizeText(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function normalizeLabel(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractM3U(text) {
  const source = normalizeText(text);
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const clean = stripDecorations(line);
    const normalized = normalizeLabel(clean);
    if (
      /link\s*\(\s*m3u\s*\)\s*:/.test(normalized) &&
      !/(curto|m3u8|mpegts|hls)/.test(normalized)
    ) {
      const match = clean.match(/https?:\/\/\S+/i);
      if (match) {
        const url = sanitizeUrl(match[0]);
        if (isValidM3UUrl(url)) return url;
      }
    }
  }

  for (const line of lines) {
    const normalized = normalizeLabel(stripDecorations(line));
    if (/(curto|m3u8|mpegts|hls)/.test(normalized)) continue;

    const urls = line.match(/https?:\/\/\S+/gi) || [];
    for (const rawUrl of urls) {
      const url = sanitizeUrl(rawUrl);
      if (isValidM3UUrl(url)) return url;
    }
  }

  return null;
}

function extractCredentials(text) {
  const source = normalizeText(text);
  const normalized = normalizeLabel(source);

  const username =
    extractCredentialByLabels(source, ['usuario', 'user', 'login']) ||
    extractQueryParam(source, 'username');
  const password =
    extractCredentialByLabels(source, ['senha', 'password', 'pass']) ||
    extractQueryParam(source, 'password');

  return {
    username: sanitizeCredential(username),
    password: sanitizeCredential(password)
  };
}

function extractCredentialByLabels(source, labels) {
  const lines = source.split('\n');
  for (const line of lines) {
    const clean = stripDecorations(line);
    const normalized = normalizeLabel(clean);
    if (!labels.some((label) => normalized.includes(label))) continue;

    const separatorIndex = clean.search(/[:=-]/);
    if (separatorIndex === -1) continue;

    const value = clean.slice(separatorIndex + 1).trim().split(/\s+/)[0];
    if (value) return value;
  }
  return null;
}

function extractQueryParam(source, paramName) {
  const urls = source.match(/https?:\/\/\S+/gi) || [];
  for (const rawUrl of urls) {
    try {
      const parsed = new URL(sanitizeUrl(rawUrl));
      const value = parsed.searchParams.get(paramName);
      if (value) return value;
    } catch (err) {
      continue;
    }
  }
  return null;
}

function stripDecorations(value) {
  return String(value || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[>*_`]/g, '')
    .trim();
}

function stripMarkdown(value) {
  return String(value || '').replace(/[>*_`]/g, '').trim();
}

function sanitizeCredential(value) {
  if (!value) return null;
  const clean = decodeURIComponent(stripMarkdown(value)).replace(/[.,;]+$/g, '').trim();
  return isValidCredential(clean) ? clean : null;
}

function isValidCredential(value) {
  const clean = String(value || '').trim();
  if (clean.length < 2 || clean.length > 80) return false;
  if (/\s/.test(clean)) return false;
  return /^[A-Za-z0-9._@+-]+$/.test(clean);
}

function sanitizeUrl(url) {
  return String(url || '')
    .trim()
    .replace(/[)>\]}.,;]+$/g, '')
    .replace(/\*+$/g, '');
}

function isValidM3UUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  if (isShortUrl(parsed.hostname)) return false;

  const lowered = url.toLowerCase();
  if (/\b(m3u8|mpegts|hls)\b/.test(lowered)) return false;

  const type = parsed.searchParams.get('type');
  if (type && !/^m3u(_plus)?$/i.test(type)) return false;

  if (/get\.php$/i.test(parsed.pathname)) {
    return Boolean(parsed.searchParams.get('username') && parsed.searchParams.get('password'));
  }

  return /\.m3u$/i.test(parsed.pathname);
}

function isShortUrl(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^www\./, '');
  return [
    'bit.ly',
    'tinyurl.com',
    't.co',
    'goo.gl',
    'is.gd',
    'cutt.ly',
    'shorturl.at',
    'rebrand.ly',
    'ow.ly',
    's.id'
  ].includes(host);
}

function looksLikeDeviceKey(text) {
  const value = String(text || '').trim();
  if (value.length < 3 || value.length > 80) return false;
  if (/\s/.test(value)) return false;
  if (/^\//.test(value)) return false;
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

module.exports = {
  extractM3U,
  extractCredentials,
  isValidCredential,
  isValidM3UUrl,
  looksLikeDeviceKey,
  normalizeText
};
