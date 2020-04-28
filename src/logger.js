const winston = require('winston');

module.exports = (options) => winston.createLogger({
  transports: [ new winston.transports.Console({
    format: (() => {
      switch (options.outputFormat) {
        case 'json':
          return winston.format.json();
        case 'text':
          return winston.format.simple();
        case 'colors':
        default:
          return winston.format.combine(
            winston.format.cli(),
            winston.format.printf(({ level, message, ...rest }) => {
              const stringifiedRest = JSON.stringify(rest);
              if ('{}' === stringifiedRest) {
                return `${level}: ${message}`;
              }
              return `${level}: ${message} ${stringifiedRest}`;
            })
          );
      }
    }) (),
    level: options.verbose ? 'debug' : 'info',
  }) ],
});
