const S3 = require('./mock/s3');
const fetch = require('../src/fetch');

const mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());
const mockS3 = new S3();

const localPrefix = `${__dirname}/mock/local-filesystem`;

test('it fetches', async () => {

  expect.assertions(2);

  return fetch(mockS3, 'foo', localPrefix).then(({ local, remote }) => {

    expect(local).toEqual({ 'a.txt': 'bf072e9119077b4e76437a93986787ef' });
    expect(remote).toEqual({ 'a.txt': 'abc123' });

  });

});

test('it sends the correct params', async () => {

  expect.assertions(2);

  return fetch(mockS3, 'foo', localPrefix, 'some/nested/path').then(() => {

    expect(mockS3.lastListObjectsV2Params.Bucket).toEqual('foo');
    expect(mockS3.lastListObjectsV2Params.Prefix).toEqual('/some/nested/path/');

  });

});

afterAll(() => {
  mockLog.mockRestore();
});
