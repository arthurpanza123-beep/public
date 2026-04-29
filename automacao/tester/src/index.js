const config = require('./config');
const logger = require('./logger');
const app = require('./server');

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'tester ouvindo comandos.');
});
