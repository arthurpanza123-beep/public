const pino = require('pino');
const config = require('./config');

module.exports = pino({
  level: config.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'headers.authorization', '*.password', '*.senha'],
    remove: true
  }
});
