const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const installSoftDelete = require('../src/installSoftDelete');
const options = require('./mock/options')['install-soft-delete']().parse('install-soft-delete');

describe('installSoftDelete', () => {

  let mockS3;
  let mockLogger;

  beforeEach(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it sends the correct params and resolves with the ID', async () => {

    const resolution = await installSoftDelete(mockLogger, mockS3, options);

    expect(mockS3.putBucketLifecycleConfigurationParams.length).toBe(1);
    expect(mockS3.putBucketLifecycleConfigurationParams[0].LifecycleConfiguration.Rules[0].ID).toBe(resolution);
    expect(options.id).toBe(resolution);

  });

});
