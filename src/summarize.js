module.exports = (logger, added, modified, unmodified, deleted, invalidated, options) => {

  logger.info('Deployment complete', {
    added: added.length,
    modified: modified.length,
    unmodified: modified.length,
    deleted: !options.softDelete ? deleted.length : 0,
    softDeleted: options.softDelete ? deleted.length : 0,
    unSoftDeleted: options.softDelete ? unmodified.length : 0,
    invalidated: invalidated.length,
  });

  return Promise.resolve();

};
