const createLifecycle = (logger, s3, options, previous = {}) => {

  logger.debug(`Creating lifecycle ${options.softDeleteLifecycleId}...`, {
    expiration: options.softDeleteLifecycleExpiration,
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
    .then(() => {
      logger.info(`Soft-delete lifecycle rule created on s3://${options.bucket} named "${options.softDeleteLifecycleId}"`);
      return options.softDeleteLifecycleId;
    });

};

module.exports = (logger, s3, options) => (
  s3.getBucketLifecycleConfiguration({ Bucket: options.bucket })
    .promise()
    .then((config) => {
      if (config.Rules.find((rule) => options.softDeleteLifecycleId === rule.ID)) {
        return Promise.reject(new Error(`Lifecycle rule ${options.softDeleteLifecycleId} already exists`));
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

