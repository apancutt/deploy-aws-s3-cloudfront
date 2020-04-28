module.exports = (modified, deleted, options) => Promise.resolve(
  options.distribution
    ? options.invalidationPaths.length
      ? options.invalidationPaths
      : modified.concat(deleted).map((object) => object.path.cloudfront)
    : []
);
