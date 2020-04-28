const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const softDeleteLifecycle = require('../src/softDeleteLifecycle');
const options = require('./mock/options').argv;

describe('softDeleteLifecycle', () => {

  let mockS3;
  let mockLogger;

  const deleted = [{
    acl: undefined,
    cacheControl: undefined,
    contentLength: undefined,
    contentType: undefined,
    path: {
      cloudFront: '/test/remote.txt',
      local: `${options.source}remote.txt`,
      relative: 'remote.txt',
      s3: 'test/remote.txt',
    },
    tagSet: [],
  }];

  beforeAll(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it sends the correct params and resolves with the ID', async () => {

    expect.assertions(2);

    return softDeleteLifecycle(mockLogger, mockS3, deleted, { ...options, softDelete: true }).then((resolution) => {

      expect(mockS3.lastPutBucketLifecycleConfigurationParams.LifecycleConfiguration.Rules[0].ID).toEqual(resolution);
      expect(options.softDeleteLifecycleId).toEqual(resolution);

    });

  });

});
