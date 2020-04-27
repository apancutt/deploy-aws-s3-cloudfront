const INVALIDATION_LIMIT = 3000; // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#InvalidationLimits

const sanitize = (key, allowAsterix = false) => {

  key = encodeURIComponent(key)
    .replace(/~/g, '%7E')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/%2F/g, '/') // Restore slashes

  if (!allowAsterix) {
    key = key.replace(/\*/g, '%2A');
  }

  if (!key.startsWith('/')) {
    key = `/${key}`;
  }

  return key;

};

module.exports = (cloudfront, stale, options) => Promise.all(
  Array(Math.ceil(stale.length / INVALIDATION_LIMIT))
    .fill()
    .map((_, index) => index * INVALIDATION_LIMIT)
    .map((start) => stale.slice(start, start + INVALIDATION_LIMIT))
    .map((batch) => sanitize(batch, !!options['invalidation-paths'].length))
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
