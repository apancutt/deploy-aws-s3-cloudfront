const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const installSoftDelete = require('../src/installSoftDelete');
const options = require('./mock/options')['install-soft-delete']().parse('install-soft-delete');

describe('installSoftDelete', () => {

  let mockS3;
  let mockLogger;

  beforeAll(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it sends the correct params and resolves with the ID', async () => {

    expect.assertions(2);

    return installSoftDelete(mockLogger, mockS3, options).then((resolution) => {

      expect(mockS3.lastPutBucketLifecycleConfigurationParams.LifecycleConfiguration.Rules[0].ID).toEqual(resolution);
      expect(options.id).toEqual(resolution);

    });

  });

});
