const prettyBytes = require('pretty-bytes');
const PromptConfirm = require('prompt-confirm');
const { debug, info, warn } = require('./log');

module.exports = (payload, options) => {

  Object.entries(payload).forEach(([ , params ]) => {

    if (params.source) {
      info(`File at ${params.source} will be uploaded to s3://${options.bucket}/${params.destination}`);
      if (params.acl) {
        debug(`ACL: ${params.acl}`);
      }
      if (params['cache-control']) {
        debug(`Cache-Control: ${params['cache-control']}`);
      }
      debug(`Content-Length: ${prettyBytes(params['content-length'])}`);
      debug(`Content-Type: ${params['content-type']}`);
    } else if (options['soft-delete']) {
      warn(`Object at s3://${options.bucket}/${params.destination} will be soft-deleted`);
    } else {
      warn(`Object at s3://${options.bucket}/${params.destination} will be deleted`);
    }

    debug(`Tags: ${Object.entries(params['tags']).map(([ key, value ]) => `${key}=${value}`).join(',')}`);

  });

  return (!options['non-interactive'] && Object.keys(payload).length)
    ? (new PromptConfirm('Continue deployment?')).run()
    : Promise.resolve(true);

};
