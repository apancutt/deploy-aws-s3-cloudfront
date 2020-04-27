module.exports = (logger, localObjects, remoteObjects, deletionPolicy) => {

  const added = [];
  const modified = [];
  const deleted = [];

  localObjects.forEach((localObject) => {

    const remoteObject = remoteObjects.find((remoteObject) => remoteObject.relative === localObject.relative);

    if (!remoteObject) {
      added.push(localObject);
    } else if (remoteObject.checksum !== localObject.checksum) {
      modified.push(localObject);
    }

  });

  if (deletionPolicy) {
    remoteObjects.forEach((remoteObject) => {

      const localObject = localObjects.find((localObject) => localObject.relative === remoteObject.relative);

      if (!localObject) {
        deleted.push(remoteObject);
      }

    });
  }

  added.concat(modified).forEach((localObject) => {
    logger.info(`${localObject.relative} (${localObject.sizeForHumans}) will be uploaded as ${localObject.type}`);
  });

  deleted.forEach((remoteObject) => {
    if ('soft' === deletionPolicy) {
      logger.warn(`${remoteObject.s3path} will be soft-deleted`);
    } else {
      logger.warn(`${remoteObject.s3path} will be deleted`);
    }
  });

  return Promise.resolve([ added, modified, deleted ]);

};
