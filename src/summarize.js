module.exports = (logger, added, modified, deleted, invalidated, options) => {

  logger.info('Deployment complete', {
    added: added.length,
    modified: modified.length,
    deleted: !options.softDelete ? deleted.length : 0,
    softDeleted: options.softDelete ? deleted.length : 0,
    invalidated: invalidated.length,
  });

  return Promise.resolve();

};
