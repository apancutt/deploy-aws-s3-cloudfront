const fetch = require('../src/fetch');
let s3, lastParams, mockLog;

const localPrefix = `${__dirname}/mock`;

beforeAll(() => {

  s3 = {
    listObjectsV2: (params) => {
      lastParams = params;
      return {
        promise: () => Promise.resolve({
          Contents: [
            { Key: '/a.txt', ETag: 'abc123' },
          ],
          ContinuationToken: undefined,
          IsTruncated: false,
        }),
      };
    },
  };

  mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

});

test('it fetches', async () => {

  expect.assertions(2);

  return fetch(s3, 'foo', localPrefix).then(({ local, remote }) => {

    expect(local).toEqual({ 'a.txt': 'bf072e9119077b4e76437a93986787ef' });
    expect(remote).toEqual({ 'a.txt': 'abc123' });

  });

});

test('it sends the correct params', async () => {

  expect.assertions(2);

  return fetch(s3, 'foo', localPrefix, 'some/nested/path').then(() => {

    expect(lastParams.Bucket).toEqual('foo');
    expect(lastParams.Prefix).toEqual('/some/nested/path/');

  });

});

afterAll(() => {
  s3 = undefined;
  lastParams = undefined;
  mockLog.mockRestore();
});
