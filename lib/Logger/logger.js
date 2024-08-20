 const { createLogger, format, transports } = require('winston');
const { combine, timestamp, simple } = format;
const { Console, File } = transports;

const Logger = createLogger({
  format: combine(
    timestamp(),
    simple()
  ),
  transports: [
    new Console({
      timestamp: timestamp(),
      colorize: true,
      level: 'info'
    }),
    new File({
      filename: 'error.log',
      level: 'error'
    })
  ]
});

const ErrorLogger = (error) => Logger.error(error);
const ResponseLogger = (data) => Logger.info(data);
// const DebugLogger = (error) => Logger.debug(error);

module.exports = {
  ErrorLogger,
  ResponseLogger,
  // DebugLogger
};
