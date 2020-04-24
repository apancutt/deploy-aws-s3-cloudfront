const { debug, warn } = require('../src/log');

module.exports = (s3, options) => (
  s3.getBucketLifecycleConfiguration({ Bucket: options.bucket }).promise()
    .then((config) => {

      if (config.Rules.find((rule) => options['soft-delete-lifecycle-id'] === rule.ID)) {
        return;
      }

      return s3.putBucketLifecycleConfiguration({
        Bucket: options.bucket,
        LifecycleConfiguration: {
          ...config,
          Rules: [
            ...config.Rules,
            {
              Expiration: {
                Days: options['soft-delete-lifecycle-expiration'],
              },
              Filter: {
                Tag: {
                  Key: options['soft-delete-lifecycle-tag-key'],
                  Value: options['soft-delete-lifecycle-tag-value'],
                },
              },
              ID: options['soft-delete-lifecycle-id'],
              Status: 'Enabled',
            },
          ],
        }
      }).promise()
        .then(() => {
          warn(`A new lifecycle policy was created on s3://${options.bucket} with ID ${options['soft-delete-lifecycle-id']}`);
          debug(`Expiration: ${options['soft-delete-lifecycle-expiration']}`);
          debug(`Tag Key: ${options['soft-delete-lifecycle-tag-key']}`);
          debug(`Tag Value: ${options['soft-delete-lifecycle-tag-value']}`);
        })

    })
);

