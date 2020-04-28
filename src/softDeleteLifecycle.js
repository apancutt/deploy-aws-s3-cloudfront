const createLifecycle = (logger, s3, options, previous = {}) => {

  logger.debug('Creating lifecycle...', {
    expiration: options.softDeleteLifecycleExpiration,
    id: options.softDeleteLifecycleId,
    tagKey: options.softDeleteLifecycleTagKey,
    tagValue: options.softDeleteLifecycleTagValue,
  });

  return s3.putBucketLifecycleConfiguration({
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
    .then(() => options.softDeleteLifecycleId);

};

module.exports = (logger, s3, deleted, options) => (!options.softDelete || !deleted.length) ? Promise.resolve() : (
  s3.getBucketLifecycleConfiguration({ Bucket: options.bucket })
    .promise()
    .then((config) => {
      if (config.Rules.find((rule) => options.softDeleteLifecycleId === rule.ID)) {
        logger.debug('Lifecycle rule for soft-deletion already exists', {
          id: options.softDeleteLifecycleId,
        });
        return;
      }
      return createLifecycle(logger, s3, options, config);
    })
    .catch((err) => {
      if (!err || 'NoSuchLifecycleConfiguration' !== err.code) {
        return Promise.reject(err);
      }
      return createLifecycle(logger, s3, options);
    })
);

