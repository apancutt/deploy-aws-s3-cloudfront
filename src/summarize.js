module.exports = (logger, added, modified, deleted, invalidated, options) => {
  logger.info('Deployment complete')
  logger.debug(`Added: ${added.length}`);
  logger.debug(`Modified: ${modified.length}`);
  logger.debug(`${options.softDelete ? 'Soft-Deleted' : 'Deleted'}: ${deleted.length}`);
  logger.debug(`Invalidated: ${invalidated.length}`);
  return Promise.resolve();
};
