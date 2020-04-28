const PromptConfirm = require('prompt-confirm');

module.exports = (logger, paths, options) => {

  paths.forEach((path) => {
    logger.info(`${path} will be invalidated`);
  });

  return Promise.resolve(
    (!options.nonInteractive && paths.length)
      ? (new PromptConfirm('Proceed with invalidation?')).run()
      : true
  ).then((confirmed) => confirmed ? paths : []);

};
