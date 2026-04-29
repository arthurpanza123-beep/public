const { chromium } = require('playwright');
const config = require('./config');
const logger = require('./logger');

async function main() {
  if (!config.loginUrl) {
    throw new Error('Configure PANEL_LOGIN_URL ou PANEL_BASE_URL antes de abrir o login.');
  }

  const context = await chromium.launchPersistentContext(config.userDataDir, {
    headless: false,
    viewport: { width: 1366, height: 768 }
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });

  logger.info({ userDataDir: config.userDataDir }, 'Finalize o login no navegador. O perfil sera reutilizado pelo tester.');
  await new Promise(() => {});
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Falha ao abrir login persistente.');
  process.exit(1);
});
