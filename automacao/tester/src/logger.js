const pino = require('pino');
const config = require('./config');

module.exports = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.senha', '*.PANEL_PASSWORD'],
    remove: true
  }
});
