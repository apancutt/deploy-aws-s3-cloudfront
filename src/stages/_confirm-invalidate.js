const PromptConfirm = require('prompt-confirm');
const { debug, info } = require('./log');

module.exports = (stale, options) => {

  if (!stale.length) {
    return Promise.resolve(true);
  }

  stale.forEach((path) => {
    info(`Object(s) at s3://${options.bucket}/${path} will be invalidated at CloudFront`);
  });

  debug(`Distribution: ${options.distribution}`);

  return !options['non-interactive']
    ? (new PromptConfirm('Continue invalidation?')).run()
    : Promise.resolve(true);

};
