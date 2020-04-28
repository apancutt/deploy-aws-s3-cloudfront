const INVALIDATION_LIMIT = 3000; // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#InvalidationLimits

module.exports = (cloudFront, paths, options) => Promise.all(
  Array(Math.ceil(paths.length / INVALIDATION_LIMIT))
    .fill()
    .map((_, index) => index * INVALIDATION_LIMIT)
    .map((start) => paths.slice(start, start + INVALIDATION_LIMIT))
    .map((paths) => cloudFront.createInvalidation({
      DistributionId: options.distribution,
      InvalidationBatch: {
        CallerReference: `${+new Date()}`,
        Paths: {
          Items: paths,
          Quantity: paths.length,
        },
      },
    }).promise())
)
  .then(() => paths);
