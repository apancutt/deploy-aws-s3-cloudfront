const CloudFront = require('./mock/cloudfront');
const invalidate = require('../src/invalidate');

const mockCloudFront = new CloudFront();
const mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());

test('it invalidates', async () => {

  expect.assertions(1);

  return invalidate(mockCloudFront, 'foo', [ 'foo.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/foo.txt' ]);

  });

});

test('it sends the correct params', async () => {

  expect.assertions(4);

  return invalidate(mockCloudFront, 'foo', [ 'foo.txt' ]).then((paths) => {

    expect(mockCloudFront.lastCreateInvalidationParams.DistributionId).toEqual('foo');
    expect(typeof mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.CallerReference).toEqual('string');
    expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Items).toEqual(paths);
    expect(mockCloudFront.lastCreateInvalidationParams.InvalidationBatch.Paths.Quantity).toEqual(paths.length);

  });

});

test('it ignores leading slashes', async () => {

  expect.assertions(1);

  return invalidate(mockCloudFront, 'foo', [ '/foo.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/foo.txt' ]);

  });

});

test('it invalidates keys with special characters', async () => {

  expect.assertions(1);

  return invalidate(mockCloudFront, 'foo', [ '~foo (\'bar\')!.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/%7Efoo%20%28%27bar%27%29%21.txt' ]);

  });

});

test('it does not encode keys when instructed', async () => {

  expect.assertions(1);

  return invalidate(mockCloudFront, 'foo', [ '*' ], false).then((paths) => {

    expect(paths).toEqual([ '/*' ]);

  });

});

afterAll(() => {
  mockLog.mockRestore();
});
