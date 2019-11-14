const invalidate = require('../src/invalidate');
let cloudfront, lastParams, mockLog;

beforeAll(() => {

  cloudfront = {
    createInvalidation: (params) => {
      lastParams = params;
      return {
        promise: () => Promise.resolve(),
      };
    },
  };

  mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

});

test('it invalidates', async () => {

  expect.assertions(1);

  return invalidate(cloudfront, 'foo', [ 'foo.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/foo.txt' ]);

  });

});

test('it sends the correct params', async () => {

  expect.assertions(4);

  return invalidate(cloudfront, 'foo', [ 'foo.txt' ]).then((paths) => {

    expect(lastParams.DistributionId).toEqual('foo');
    expect(typeof lastParams.InvalidationBatch.CallerReference).toEqual('string');
    expect(lastParams.InvalidationBatch.Paths.Items).toEqual(paths);
    expect(lastParams.InvalidationBatch.Paths.Quantity).toEqual(paths.length);

  });

});

test('it ignores leading slashes', async () => {

  expect.assertions(1);

  return invalidate(cloudfront, 'foo', [ '/foo.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/foo.txt' ]);

  });

});

test('it invalidates keys with special characters', async () => {

  expect.assertions(1);

  return invalidate(cloudfront, 'foo', [ '~foo (\'bar\')!.txt' ]).then((paths) => {

    expect(paths).toEqual([ '/%7Efoo%20%28%27bar%27%29%21.txt' ]);

  });

});

test('it does not encode keys when instructed', async () => {

  expect.assertions(1);

  return invalidate(cloudfront, 'foo', [ '*' ], false).then((paths) => {

    expect(paths).toEqual([ '/*' ]);

  });

});

afterAll(() => {
  cloudfront = undefined;
  lastParams = undefined;
  mockLog.mockRestore();
});
