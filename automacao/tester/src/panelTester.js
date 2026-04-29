const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger');

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function requireValue(value, code) {
  if (!value) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }
  return value;
}

async function isVisible(page, selector) {
  if (!selector) return false;
  try {
    return await page.locator(selector).first().isVisible({ timeout: 1500 });
  } catch (error) {
    return false;
  }
}

async function fillIfSelector(page, selector, value) {
  if (!selector) return;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible' });
  await locator.fill(String(value || ''));
}

async function fillBySelectorOrHints(page, selector, hints, value) {
  if (selector) return fillIfSelector(page, selector, value);

  for (const hint of hints) {
    const attempts = [
      () => page.getByLabel(hint).first(),
      () => page.getByPlaceholder(hint).first(),
      () => page.locator(`input[name*="${hint.source || hint}" i], textarea[name*="${hint.source || hint}" i]`).first()
    ];

    for (const buildLocator of attempts) {
      try {
        const locator = buildLocator();
        await locator.waitFor({ state: 'visible', timeout: 1500 });
        await locator.fill(String(value || ''));
        return;
      } catch (error) {
        // Try the next hint.
      }
    }
  }

  const error = new Error('FIELD_NOT_FOUND');
  error.code = 'FIELD_NOT_FOUND';
  throw error;
}

async function clickIfSelector(page, selector) {
  if (!selector) return false;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible' });
  await locator.click();
  return true;
}

async function clickBySelectorOrHints(page, selector, hints) {
  if (await clickIfSelector(page, selector)) return;

  for (const hint of hints) {
    try {
      const locator = page.getByRole('button', { name: hint }).first();
      await locator.waitFor({ state: 'visible', timeout: 1500 });
      await locator.click();
      return;
    } catch (error) {
      // Try the next button text.
    }
  }

  const error = new Error('SUBMIT_NOT_FOUND');
  error.code = 'SUBMIT_NOT_FOUND';
  throw error;
}

async function readText(page, selector) {
  if (!selector) return '';
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible' });
  return (await locator.innerText()).trim();
}

function extractValue(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

class PanelTester {
  constructor() {
    this.queue = Promise.resolve();
  }

  async createTrial(input) {
    const job = this.queue.then(() => this.createTrialUnsafe(input));
    this.queue = job.catch(() => {});
    return job;
  }

  async createTrialUnsafe(input) {
    const requestId = input.requestId || `trial-${Date.now()}`;
    const customerName = requireValue(input.customerName || input.name, 'MISSING_CUSTOMER_NAME');
    const phone = normalizePhone(requireValue(input.phone, 'MISSING_PHONE'));

    let context;
    let page;

    try {
      this.validateConfig();
      fs.mkdirSync(config.userDataDir, { recursive: true });
      fs.mkdirSync(config.errorsDir, { recursive: true });

      context = await chromium.launchPersistentContext(config.userDataDir, {
        headless: config.headless,
        slowMo: config.slowMoMs,
        viewport: { width: 1366, height: 768 }
      });

      page = context.pages()[0] || await context.newPage();
      page.setDefaultTimeout(config.timeoutMs);

      await this.ensureLoggedIn(page);
      await this.openTrialForm(page);
      await this.fillTrialForm(page, { customerName, phone });
      await this.submitTrialForm(page);

      const credentials = await this.readCredentials(page);
      logger.info({ requestId, phone }, 'Teste criado com sucesso no painel.');

      return {
        ok: true,
        requestId,
        provider: credentials.provider,
        username: credentials.username,
        password: credentials.password,
        expiresAt: credentials.expiresAt,
        raw: credentials.raw
      };
    } catch (error) {
      const safeError = await this.buildSafeError(error, page, requestId);
      logger.error({ err: error, requestId, safeError }, 'Falha segura ao criar teste.');
      return safeError;
    } finally {
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }

  validateConfig() {
    requireValue(config.testUrl, 'MISSING_PANEL_TEST_URL');
  }

  async ensureLoggedIn(page) {
    await page.goto(config.testUrl, { waitUntil: 'domcontentloaded' });

    if (config.selectors.loggedInCheck && await isVisible(page, config.selectors.loggedInCheck)) {
      return;
    }

    const loginVisible = await isVisible(page, config.selectors.username)
      || await isVisible(page, config.selectors.password);

    if (!loginVisible) return;

    requireValue(config.username, 'MISSING_PANEL_USERNAME');
    requireValue(config.password, 'MISSING_PANEL_PASSWORD');
    requireValue(config.selectors.username, 'MISSING_PANEL_USERNAME_SELECTOR');
    requireValue(config.selectors.password, 'MISSING_PANEL_PASSWORD_SELECTOR');
    requireValue(config.selectors.loginButton, 'MISSING_PANEL_LOGIN_BUTTON_SELECTOR');

    await fillIfSelector(page, config.selectors.username, config.username);
    await fillIfSelector(page, config.selectors.password, config.password);
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      clickIfSelector(page, config.selectors.loginButton)
    ]);

    await page.goto(config.testUrl, { waitUntil: 'domcontentloaded' });
  }

  async openTrialForm(page) {
    await page.goto(config.testUrl, { waitUntil: 'domcontentloaded' });
    if (config.selectors.newTestButton) {
      await clickIfSelector(page, config.selectors.newTestButton);
    }
  }

  async fillTrialForm(page, { customerName, phone }) {
    await fillBySelectorOrHints(page, config.selectors.name, [/nome/i, /cliente/i, /name/i], customerName);
    await fillBySelectorOrHints(page, config.selectors.phone, [/telefone/i, /whatsapp/i, /celular/i, /phone/i], phone);

    if (config.selectors.duration) {
      const duration = page.locator(config.selectors.duration).first();
      await duration.waitFor({ state: 'visible' });
      const tagName = await duration.evaluate((element) => element.tagName.toLowerCase()).catch(() => '');

      if (tagName === 'select') {
        await duration.selectOption(config.selectors.durationValue);
      } else {
        await duration.fill(config.selectors.durationValue).catch(async () => {
          await duration.click();
          await page.keyboard.type(config.selectors.durationValue);
        });
      }
    }
  }

  async submitTrialForm(page) {
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      clickBySelectorOrHints(page, config.selectors.submit, [/criar/i, /gerar/i, /salvar/i, /teste/i, /enviar/i])
    ]);

    if (config.selectors.successWait) {
      await page.locator(config.selectors.successWait).first().waitFor({ state: 'visible' });
    }
  }

  async readCredentials(page) {
    const pageText = await page.locator('body').innerText().catch(() => '');
    const provider = config.selectors.provider
      ? await readText(page, config.selectors.provider)
      : config.defaultProvider;
    const username = config.selectors.usernameResult
      ? await readText(page, config.selectors.usernameResult)
      : extractValue(pageText, [/usu[aá]rio\\s*[:\\-]\\s*([^\\n]+)/i, /login\\s*[:\\-]\\s*([^\\n]+)/i, /user\\s*[:\\-]\\s*([^\\n]+)/i]);
    const password = config.selectors.passwordResult
      ? await readText(page, config.selectors.passwordResult)
      : extractValue(pageText, [/senha\\s*[:\\-]\\s*([^\\n]+)/i, /password\\s*[:\\-]\\s*([^\\n]+)/i]);
    const expiresAt = config.selectors.expiresResult
      ? await readText(page, config.selectors.expiresResult)
      : extractValue(pageText, [/vencimento\\s*[:\\-]\\s*([^\\n]+)/i, /expira\\s*[:\\-]\\s*([^\\n]+)/i, /validade\\s*[:\\-]\\s*([^\\n]+)/i]);

    if (config.neverSendIfMissingFields && (!username || !password || !expiresAt)) {
      const error = new Error('INCOMPLETE_CREDENTIALS');
      error.code = 'INCOMPLETE_CREDENTIALS';
      throw error;
    }

    return {
      provider,
      username,
      password,
      expiresAt,
      raw: { provider, username, password, expiresAt }
    };
  }

  async buildSafeError(error, page, requestId) {
    const errorId = `${requestId}-${Date.now()}`;
    let screenshotPath = null;

    if (page) {
      screenshotPath = path.join(config.errorsDir, `${errorId}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {
        screenshotPath = null;
      });
    }

    return {
      ok: false,
      requestId,
      code: error.code || 'PANEL_TEST_CREATION_FAILED',
      message: 'Nao foi possivel criar o teste com seguranca. Avise Arthur e nao envie credenciais ao cliente.',
      errorId,
      screenshotPath
    };
  }
}

module.exports = new PanelTester();
