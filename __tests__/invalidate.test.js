const Logger = require('./mock/logger');
const CloudFront = require('./mock/cloudfront');
const invalidate = require('../src/invalidate');
const options = require('./mock/options').argv;

describe('invalidate', () => {

  let mockCloudFront;
  let mockLogger;

  beforeAll(() => {
    mockLogger = new Logger();
    mockCloudFront = new CloudFront();
  });

  test('it sends the correct params and resolves with invalidated paths', async () => {

    expect.assertions(5);

    const paths = [ '/foo.txt' ];

    return invalidate(mockLogger, mockCloudFront, paths, options).then((resolution) => {

      expect(mockCloudFront.lastCreateInvalidationParams.DistributionId).toEqual(options.distribution);
      expect(typeof mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.CallerReference).toEqual('string');
      expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Items).toEqual(resolution);
      expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Quantity).toEqual(resolution.length);
      expect(resolution).toEqual(paths);

    });

  });

});
