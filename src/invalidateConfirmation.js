const { Confirm } = require('enquirer');

module.exports = (logger, paths, options) => {

  paths.forEach((path) => {
    logger.info(`${path} will be invalidated`);
  });

  return Promise.resolve(
    (!options.nonInteractive && paths.length)
      ? new Confirm({ message: 'Proceed with invalidation?' }).run()
      : true
  ).then((confirmed) => confirmed ? paths : []);

};
