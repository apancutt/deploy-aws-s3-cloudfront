const createLifecycle = (logger, s3, bucket, id, key, value, expiration, existingConfig) => (
  s3.putBucketLifecycleConfiguration({
    Bucket: bucket,
    LifecycleConfiguration: {
      ...existingConfig,
      Rules: [
        ...(existingConfig.Rules || []),
        {
          Expiration: {
            Days: expiration,
          },
          Filter: {
            Tag: {
              Key: key,
              Value: value,
            },
          },
          ID: id,
          Status: 'Enabled',
        },
      ],
    }
  })
    .promise()
    .then(() => {
      logger.warn(`A new lifecycle policy was created on s3://${bucket} with ID "${id}"`);
    })
);

module.exports = (logger, s3, bucket, id, key, value, expiration) => (
  s3.getBucketLifecycleConfiguration({ Bucket: bucket })
    .promise()
    .then((config) => {
      if (config.Rules.find((rule) => id === rule.ID)) {
        logger.info(`A lifecycle policy already exists on s3://${bucket} with ID "${id}"`);
        return;
      }
      return createLifecycle(logger, s3, bucket, id, key, value, expiration, config);
    })
    .catch((err) => {
      if (!err || 'NoSuchLifecycleConfiguration' !== err.code) {
        return Promise.reject(err);
      }
      return createLifecycle(logger, s3, bucket, id, key, value, expiration, {});
    })
);

