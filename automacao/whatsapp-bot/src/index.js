const config = require('./config');
const logger = require('./logger');
const app = require('./server');
const whatsapp = require('./whatsapp');

async function main() {
  await whatsapp.start();

  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'whatsapp-bot ouvindo comandos.');
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Falha fatal no whatsapp-bot.');
  process.exit(1);
});
