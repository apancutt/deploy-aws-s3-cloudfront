const INVALIDATION_LIMIT = 3000; // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#InvalidationLimits

module.exports = (cloudfront, stale, options) => Promise.all(
  Array(Math.ceil(stale.length / INVALIDATION_LIMIT))
    .fill()
    .map((_, index) => index * INVALIDATION_LIMIT)
    .map((start) => stale.slice(start, start + INVALIDATION_LIMIT))
    .map((batch) => cloudfront.createInvalidation({
      DistributionId: options.distribution,
      InvalidationBatch: {
        CallerReference: `${+new Date()}`,
        Paths: {
          Items: batch,
          Quantity: batch.length,
        },
      },
    }).promise())
)
  .then(() => stale);
