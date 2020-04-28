module.exports = (modified, deleted, options) => Promise.resolve(
  options.distribution
    ? options.invalidationPath.length
      ? options.invalidationPath
      : modified.concat(deleted).map((object) => object.path.cloudFront)
    : []
);
