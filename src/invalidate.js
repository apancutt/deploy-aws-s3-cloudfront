const { info } = require('./log');
const { encodeCloudFrontKey, sanitizeCloudFrontKey } = require('./utils');

const INVALIDATION_LIMIT = 3000; // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#InvalidationLimits

module.exports = async (cloudfront, distribution, keys, convertKeysToPaths = true) => {

  let processed = [];
  const promises = [];
  const remaining = keys.map(convertKeysToPaths ? encodeCloudFrontKey : (key) => key).map(sanitizeCloudFrontKey);

  while (remaining.length) {

    const batch = remaining.splice(0, INVALIDATION_LIMIT);
    processed = processed.concat(batch);

    batch.forEach((path) => {
      info(`Invalidating ${path} on CloudFront distribution ${distribution}`);
    });

    promises.push(cloudfront.createInvalidation({
      DistributionId: distribution,
      InvalidationBatch: {
        CallerReference: `${+new Date()}`,
        Paths: {
          Items: batch,
          Quantity: batch.length,
        },
      },
    }).promise());

  }

  return Promise.all(promises).then(() => processed);

};
