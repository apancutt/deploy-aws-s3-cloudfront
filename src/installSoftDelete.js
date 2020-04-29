const createLifecycle = (logger, s3, options, previous = {}) => {

  logger.debug(`Creating lifecycle ${options.id}...`, {
    expiration: options.expiration,
    tagKey: options.tagKey,
    tagValue: options.tagValue,
  });

  return s3.putBucketLifecycleConfiguration({
    Bucket: options.bucket,
    LifecycleConfiguration: {
      ...previous,
      Rules: [
        ...(previous.Rules || []),
        {
          Expiration: {
            Days: options.expiration,
          },
          Filter: {
            Tag: {
              Key: options.tagKey,
              Value: options.tagValue,
            },
          },
          ID: options.id,
          Status: 'Enabled',
        },
      ],
    }
  })
    .promise()
    .then(() => {
      logger.info(`Soft-delete lifecycle rule created on s3://${options.bucket} named "${options.id}"`);
      return options.id;
    });

};

module.exports = (logger, s3, options) => (
  s3.getBucketLifecycleConfiguration({ Bucket: options.bucket })
    .promise()
    .then((config) => {
      if (config.Rules.find((rule) => options.id === rule.ID)) {
        return Promise.reject(new Error(`Lifecycle rule ${options.id} already exists`));
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

