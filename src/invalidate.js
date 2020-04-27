const INVALIDATION_LIMIT = 3000; // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#InvalidationLimits

module.exports = (cloudfront, objects, options) => {

  if (!options.distribution) {
    return Promise.resolve([]);
  }

  const urls = options.invalidationPaths.length ? options.invalidationPaths : objects.map((object) => object.path.cloudfront);

  return Promise.all(
    Array(Math.ceil(urls.length / INVALIDATION_LIMIT))
      .fill()
      .map((_, index) => index * INVALIDATION_LIMIT)
      .map((start) => urls.slice(start, start + INVALIDATION_LIMIT))
      .map((urls) => cloudfront.createInvalidation({
        DistributionId: options.distribution,
        InvalidationBatch: {
          CallerReference: `${+new Date()}`,
          Paths: {
            Items: urls,
            Quantity: urls.length,
          },
        },
      }).promise())
  )
    .then(() => urls);

};
