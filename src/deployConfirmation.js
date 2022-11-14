const { Confirm } = require('enquirer');

module.exports = (logger, added, modified, unmodified, deleted, options) => {

  let needsConfirmation = false;

  added.forEach((object) => {
    logger.info(`${object.path.relative} will be added`);
    needsConfirmation = true;
  });

  modified.forEach((object) => {
    logger.info(`${object.path.relative} will be modified`);
    needsConfirmation = true;
  });

  if (options.softDelete) {
    unmodified.forEach((object) => {
      logger.info(`${object.path.relative} will have soft-delete marker removed`);
      needsConfirmation = true;
    });
  }

  deleted.forEach((object) => {
    logger.warn(`${object.path.relative} will be ${options.softDelete ? 'soft-deleted' : 'deleted'}`);
    needsConfirmation = true;
  });

  return Promise.resolve(
    (!options.nonInteractive && needsConfirmation)
      ? new Confirm({ message: 'Proceed with deployment?' }).run()
      : true
  )
    .then((confirmed) => confirmed ? { added, deleted, modified, unmodified } : Promise.reject(new Error('Deployment was aborted by the user')));

};
