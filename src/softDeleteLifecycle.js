const createLifecycle = (s3, options, previous = {}) => (
  s3.putBucketLifecycleConfiguration({
    Bucket: options.bucket,
    LifecycleConfiguration: {
      ...previous,
      Rules: [
        ...(previous.Rules || []),
        {
          Expiration: {
            Days: options.softDeleteLifecycleExpiration,
          },
          Filter: {
            Tag: {
              Key: options.softDeleteLifecycleTagKey,
              Value: options.softDeleteLifecycleTagValue,
            },
          },
          ID: options.softDeleteLifecycleId,
          Status: 'Enabled',
        },
      ],
    }
  })
    .promise()
    .then(() => options.softDeleteLifeCycleId)
);

module.exports = (s3, deleted, options) => (!options.softDelete || !deleted.length) ? Promise.resolve() : (
  s3.getBucketLifecycleConfiguration({ Bucket: options.bucket })
    .promise()
    .then((config) => {
      if (config.Rules.find((rule) => options.softDeleteLifecycleId === rule.ID)) {
        return;
      }
      return createLifecycle(s3, options, config);
    })
    .catch((err) => {
      if (!err || 'NoSuchLifecycleConfiguration' !== err.code) {
        return Promise.reject(err);
      }
      return createLifecycle(s3, options);
    })
);

