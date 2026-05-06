const { XcloudAutomation } = require('./xcloud');

(async () => {
  const xcloud = new XcloudAutomation();
  try {
    await xcloud.setupSession();
    console.log('Sessao XCloud configurada com sucesso.');
  } catch (err) {
    console.error('Erro ao configurar sessao:', err.message);
    if (err.screenshotPath) {
      console.error('Screenshot salvo em:', err.screenshotPath);
    }
    process.exitCode = 1;
  } finally {
    await xcloud.close().catch(() => null);
  }
})();
