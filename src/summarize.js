module.exports = (logger, added, modified, deleted, invalidated, options) => {
  logger.info('Deployment complete')
  logger.debug(`Added: ${added.length}`);
  logger.debug(`Modified: ${modified.length}`);
  logger.debug(`${'soft' === options.delete ? 'Soft Deleted' : 'Hard Deleted'}: ${deleted.length}`);
  logger.debug(`Invalidated: ${invalidated.length}`);
  return Promise.resolve();
};
