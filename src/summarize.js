const { debug, info } = require('./log');

module.exports = (uploaded, deleted, invalidated, options) => {
  info('Deployment complete')
  debug(`Uploaded: ${Object.keys(uploaded).length}`);
  debug(`${options['soft-delete'] ? 'Soft Deleted' : 'Deleted'}: ${Object.keys(deleted).length}`);
  debug(`Invalidated: ${invalidated.length}`);
  return Promise.resolve();
};
