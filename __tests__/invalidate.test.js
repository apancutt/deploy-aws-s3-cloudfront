const Logger = require('./mock/logger');
const CloudFront = require('./mock/cloudfront');
const invalidate = require('../src/invalidate');
const options = require('./mock/options')['default']().argv;

describe('invalidate', () => {

  let mockCloudFront;
  let mockLogger;

  beforeEach(() => {
    mockLogger = new Logger();
    mockCloudFront = new CloudFront();
  });

  test('it sends the correct params and resolves with invalidated paths', async () => {

    const paths = [ '/foo.txt' ];

    const resolution = await invalidate(mockLogger, mockCloudFront, paths, options);
    expect(mockCloudFront.lastCreateInvalidationParams.DistributionId).toBe(options.distribution);
    expect(typeof mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.CallerReference).toBe('string');
    expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Quantity).toBe(resolution.length);
    expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Items).toEqual(resolution);
    expect(resolution).toEqual(paths);

  });

});
