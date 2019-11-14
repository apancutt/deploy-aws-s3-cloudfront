const colors = require('colors/safe');

const log = (message) => {
  console.log(`${colors.gray((new Date()).toISOString())} ${message}`);
}

const debug = (message) => {
  log(colors.cyan(`${colors.bold('DEBUG')} ${message}`));
};

const info = (message) => {
  log(colors.green(`${colors.bold('INFO')} ${message}`));
};

const warn = (message) => {
  log(colors.yellow(`${colors.bold('WARN')} ${message}`));
};

const error = (message) => {
  log(colors.red(`${colors.bold('ERROR')} ${message}`));
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
