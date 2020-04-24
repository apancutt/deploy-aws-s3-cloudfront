module.exports = (local, remote) => {

  const added = [];
  const modified = [];

  Object.entries(local).forEach(([ key, checksum ]) => {
    if (!(key in remote)) {
      added.push(key);
    } else if (checksum !== remote[key].checksum) {
      modified.push(key);
    }
  });

  return Promise.resolve({
    added,
    modified,
    deleted: Object.entries(remote).filter(([ key ]) => !(key in local)).map(([ key ]) => key),
  });

};
