const fs = require('fs');
const { chromium } = require('playwright');
const { config, assertXcloudConfig } = require('./config');
const { info, error } = require('./logger');

class XcloudAutomation {
  constructor() {
    this.context = null;
    this.page = null;
    this.lock = Promise.resolve();
  }

  async runExclusive(fn) {
    const previous = this.lock;
    let release;
    this.lock = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async getPage() {
    assertXcloudConfig();
    if (this.context && this.page && !this.page.isClosed()) return this.page;

    fs.mkdirSync(config.xcloud.profileDir, { recursive: true });
    this.context = await chromium.launchPersistentContext(config.xcloud.profileDir, {
      headless: config.xcloud.headless,
      slowMo: config.xcloud.slowMoMs,
      viewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    this.page = this.context.pages()[0] || (await this.context.newPage());
    this.page.setDefaultTimeout(20000);
    return this.page;
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
    }
  }

  async loginIfNeeded() {
    const page = await this.getPage();
    info('Abrindo painel XCloud');
    await page.goto(config.xcloud.panelUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => null);

    const needsLogin = await this.hasLoginForm(page);
    if (!needsLogin) {
      info('Sessao XCloud ja esta logada');
      return;
    }

    info('Sessao XCloud pediu login; digitando credenciais');
    await this.typeFirst(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="usuario" i]',
      'input[placeholder*="user" i]'
    ], config.xcloud.email);

    await this.typeFirst(page, [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="senha" i]',
      'input[placeholder*="password" i]'
    ], config.xcloud.password);

    await this.clickButtonByNames(page, ['Entrar', 'Login', 'Sign in', 'Acessar']);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => null);
    await page.waitForTimeout(2000);

    if (await this.hasLoginForm(page)) {
      throw new Error('Login XCloud nao foi concluido. Confira email/senha ou se existe captcha/2FA.');
    }
  }

  async setupSession() {
    try {
      await this.loginIfNeeded();
      return true;
    } catch (err) {
      err.screenshotPath = await this.screenshot('setup-session-error').catch(() => null);
      throw err;
    }
  }

  async addDevice(deviceKey) {
    return this.runExclusive(async () => {
      try {
        await this.loginIfNeeded();
        const page = await this.getPage();

        info('Abrindo area de dispositivos', { deviceKey });
        await this.openDevices(page);

        info('Clicando em adicionar novo dispositivo', { deviceKey });
        await this.clickConfiguredOrButton(page, config.xcloud.selectors.addDevice, [
          'Adicionar novo dispositivo',
          'Novo dispositivo',
          'Adicionar dispositivo',
          'Add new device',
          'Add device',
          'Adicionar'
        ]);

        await page.waitForTimeout(1000);

        info('Preenchendo chave do dispositivo', { deviceKey });
        if (config.xcloud.selectors.deviceKey) {
          await this.typeLocator(page, page.locator(config.xcloud.selectors.deviceKey).first(), deviceKey);
        } else {
          await this.typeDeviceKey(page, deviceKey);
        }

        info('Marcando playlist propria');
        await this.markOwnPlaylist(page);

        info('Salvando dispositivo', { deviceKey });
        await this.save(page);
        await this.waitAfterAction(page);

        return { ok: true };
      } catch (err) {
        const screenshotPath = await this.screenshot('add-device-error').catch(() => null);
        error('Erro ao adicionar dispositivo XCloud', err, { deviceKey, screenshotPath });
        err.screenshotPath = screenshotPath;
        throw err;
      }
    });
  }

  async configurePlaylist(deviceKey, m3uUrl) {
    return this.runExclusive(async () => {
      try {
        await this.loginIfNeeded();
        const page = await this.getPage();
        const url = config.xcloud.customPlaylistUrl.replace('{DEVICE_KEY}', encodeURIComponent(deviceKey));

        info('Abrindo tela de playlist customizada', { deviceKey, url });
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => null);
        await page.waitForTimeout(1000);

        info('Preenchendo URL M3U', { deviceKey });
        if (config.xcloud.selectors.playlistUrl) {
          await this.typeLocator(page, page.locator(config.xcloud.selectors.playlistUrl).first(), m3uUrl);
        } else {
          await this.typePlaylistUrl(page, m3uUrl);
        }

        info('Salvando playlist customizada', { deviceKey });
        await this.save(page);
        await this.waitAfterAction(page);

        return { ok: true };
      } catch (err) {
        const screenshotPath = await this.screenshot('playlist-error').catch(() => null);
        error('Erro ao configurar playlist XCloud', err, { deviceKey, screenshotPath });
        err.screenshotPath = screenshotPath;
        throw err;
      }
    });
  }

  async openDevices(page) {
    await page.goto(config.xcloud.panelUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => null);

    if (config.xcloud.selectors.devicesMenu) {
      await page.locator(config.xcloud.selectors.devicesMenu).first().click();
    } else {
      await this.clickTextOrRole(page, ['Dispositivos', 'Devices']);
      await page.waitForTimeout(800);
      await this.clickTextOrRole(page, ['Dispositivos', 'Devices']).catch(() => null);
    }

    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => null);
    await page.waitForTimeout(800);
  }

  async hasLoginForm(page) {
    const emailVisible = await this.isAnyVisible(page, [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="usuario" i]',
      'input[placeholder*="user" i]'
    ]);
    const passVisible = await this.isAnyVisible(page, ['input[type="password"]', 'input[name="password"]']);
    return emailVisible && passVisible;
  }

  async isAnyVisible(page, selectors) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) return true;
    }
    return false;
  }

  async typeFirst(page, selectors, value) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 2500 }).catch(() => false)) {
        await this.typeLocator(page, locator, value);
        return;
      }
    }
    throw new Error(`Campo nao encontrado: ${selectors.join(' | ')}`);
  }

  async typeLocator(page, locator, value) {
    await locator.click({ timeout: 10000 });
    await locator.fill('');
    await page.keyboard.type(String(value), { delay: 25 });
  }

  async clickButtonByNames(page, names) {
    for (const name of names) {
      const regex = new RegExp(escapeRegex(name), 'i');
      const byRole = page.getByRole('button', { name: regex }).first();
      if (await byRole.isVisible({ timeout: 2000 }).catch(() => false)) {
        await byRole.click();
        return;
      }

      const text = page.getByText(regex).first();
      if (await text.isVisible({ timeout: 2000 }).catch(() => false)) {
        await text.click();
        return;
      }
    }

    const submit = page.locator('button[type="submit"], input[type="submit"]').first();
    if (await submit.isVisible({ timeout: 1500 }).catch(() => false)) {
      await submit.click();
      return;
    }

    throw new Error(`Botao nao encontrado: ${names.join(' | ')}`);
  }

  async clickConfiguredOrButton(page, selector, names) {
    if (selector) {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await locator.click();
        return;
      }
    }
    await this.clickButtonByNames(page, names);
  }

  async clickTextOrRole(page, names) {
    for (const name of names) {
      const regex = new RegExp(escapeRegex(name), 'i');
      const link = page.getByRole('link', { name: regex }).first();
      if (await link.isVisible({ timeout: 1500 }).catch(() => false)) {
        await link.click();
        return;
      }

      const button = page.getByRole('button', { name: regex }).first();
      if (await button.isVisible({ timeout: 1500 }).catch(() => false)) {
        await button.click();
        return;
      }

      const text = page.getByText(regex).first();
      if (await text.isVisible({ timeout: 1500 }).catch(() => false)) {
        await text.click();
        return;
      }
    }
    throw new Error(`Texto/link nao encontrado: ${names.join(' | ')}`);
  }

  async typeDeviceKey(page, deviceKey) {
    const attempts = [
      () => page.getByLabel(/chave|key|device/i).first(),
      () => page.locator('input[name*="device" i]').first(),
      () => page.locator('input[name*="key" i]').first(),
      () => page.locator('input[placeholder*="chave" i]').first(),
      () => page.locator('input[placeholder*="key" i]').first()
    ];

    for (const build of attempts) {
      const locator = build();
      if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
        await this.typeLocator(page, locator, deviceKey);
        return;
      }
    }

    await this.typeFirstVisibleTextField(page, deviceKey);
  }

  async typePlaylistUrl(page, m3uUrl) {
    const attempts = [
      () => page.getByLabel(/url|m3u|playlist/i).first(),
      () => page.locator('input[name*="url" i]').first(),
      () => page.locator('textarea[name*="url" i]').first(),
      () => page.locator('input[placeholder*="url" i]').first(),
      () => page.locator('textarea[placeholder*="url" i]').first()
    ];

    for (const build of attempts) {
      const locator = build();
      if (await locator.isVisible({ timeout: 1500 }).catch(() => false)) {
        await this.typeLocator(page, locator, m3uUrl);
        return;
      }
    }

    await this.typeFirstVisibleTextField(page, m3uUrl);
  }

  async typeFirstVisibleTextField(page, value) {
    const fields = page.locator('input:visible, textarea:visible');
    const count = await fields.count();
    for (let i = 0; i < count; i += 1) {
      const field = fields.nth(i);
      const type = (await field.getAttribute('type').catch(() => '') || '').toLowerCase();
      const role = (await field.getAttribute('role').catch(() => '') || '').toLowerCase();
      if (['hidden', 'checkbox', 'radio', 'submit', 'button'].includes(type)) continue;
      if (role === 'combobox') continue;
      await this.typeLocator(page, field, value);
      return;
    }
    throw new Error('Nenhum campo de texto visivel foi encontrado.');
  }

  async markOwnPlaylist(page) {
    if (config.xcloud.selectors.ownPlaylist) {
      const locator = page.locator(config.xcloud.selectors.ownPlaylist).first();
      if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.checkOrClick(locator);
        return;
      }
    }

    const label = page.getByText(/dispositivo usa sua pr.pria lista de reprodu..o/i).first();
    if (await label.isVisible({ timeout: 3000 }).catch(() => false)) {
      await label.click();
      return;
    }

    const byLabel = page.getByLabel(/pr.pria lista|own playlist|playlist/i).first();
    if (await byLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.checkOrClick(byLabel);
      return;
    }

    const checkbox = page.locator('input[type="checkbox"]').last();
    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.checkOrClick(checkbox);
      return;
    }

    throw new Error('Nao encontrei a opcao de playlist propria do dispositivo.');
  }

  async checkOrClick(locator) {
    const checked = await locator.isChecked().catch(() => null);
    if (checked === true) return;
    if (checked === false) {
      await locator.check({ force: true }).catch(async () => locator.click({ force: true }));
      return;
    }
    await locator.click({ force: true });
  }

  async save(page) {
    await this.clickConfiguredOrButton(page, config.xcloud.selectors.save, [
      'Salvar',
      'Save',
      'Gravar',
      'Enviar',
      'Submit'
    ]);
  }

  async waitAfterAction(page) {
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => null);
    await page.waitForTimeout(1500);
  }

  async screenshot(prefix) {
    const page = await this.getPage();
    fs.mkdirSync(config.screenshotDir, { recursive: true });
    const file = `${config.screenshotDir}/${prefix}-${Date.now()}.png`;
    await page.screenshot({ path: file, fullPage: true });
    return file;
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { XcloudAutomation };
