const winston = require('winston');

const formatters = (format, debug) => {

  const collection = [ winston.format.timestamp() ];

  switch (format) {
    case 'json':
      collection.push(winston.format.json());
      break;
    case 'text':
      collection.push(winston.format.simple());
      break;
    case 'colorized':
    default:
      collection.push(winston.format.cli({ all: true }));
  }

  collection.push(winston.format.printf(({ level, message, timestamp, ...rest }) => {

      rest = JSON.stringify(debug ? rest : {});

      let output = `[${timestamp}] ${level}: ${message}`;

      if ('{}' !== rest) {
        output += ` ${rest}`;
      }

      return output;

  }));

  return winston.format.combine(...collection);

};

module.exports = (format, debug = false) => winston.createLogger({
  transports: [ new winston.transports.Console({
    format: formatters(format, debug),
    level: debug ? 'debug' : 'info',
  }) ],
});
