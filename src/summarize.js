module.exports = (logger, added, modified, deleted, invalidated, options) => {

  logger.info('Deployment complete');

  logger.debug('Summary', {
    added: added.length,
    modified: modified.length,
    deleted: !options.softDelete ? deleted.length : 0,
    softDeleted: options.softDelete ? deleted.length : 0,
    invalidated: invalidated.length,
  });

  return Promise.resolve();

};
