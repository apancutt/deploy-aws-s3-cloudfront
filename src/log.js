const colors = require('colors/safe');

const log = (message, fn = 'log') => {
  console[fn](`${colors.gray((new Date()).toISOString())} ${message}`);
}

const debug = (message) => {
  log(colors.grey(`${colors.bold('DEBUG')} ${message}`));
};

const info = (message) => {
  log(colors.green(`${colors.bold('INFO ')} ${message}`));
};

const warn = (message) => {
  log(colors.yellow(`${colors.bold('WARN ')} ${message}`));
};

const error = (message) => {
  log(colors.red(`${colors.bold('ERROR')} ${message}`), 'error');
};

const fatal = (message, exitStatus = 1) => {
  error(message);
  process.exit(exitStatus);
}

module.exports = {
  debug,
  error,
  fatal,
  info,
  warn,
};
