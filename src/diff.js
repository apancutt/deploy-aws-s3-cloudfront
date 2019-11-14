const { info, warn } = require('./log');

module.exports = async (local, remote, ignoreDeleted = true) => {

  const added = [];
  const modified = [];
  const deleted = [];

  Object.entries(local).forEach(([ key, checksum ]) => {
    if (!(key in remote)) {
      info(`New file ${key} will be uploaded`);
      added.push(key);
    } else if (checksum !== remote[key]) {
      info(`Modified file ${key} will be uploaded`);
      modified.push(key);
    }
  });

  if (!ignoreDeleted) {
    Object.keys(remote).filter((key) => !(key in local)).forEach((key) => {
      warn(`Deleted file ${key} will be removed`);
      deleted.push(key);
    });
  }

  if (!added.length && !modified.length && !deleted.length) {
    info('No changes detected');
  }

  return {
    added,
    modified,
    deleted,
  };

};
