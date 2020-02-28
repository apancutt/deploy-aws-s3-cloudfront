const fs = require('fs');
const S3 = require('./mock/s3');
const deploy = require('../src/deploy');

describe('deploy', () => {

  let mockLog;
  let mockS3;

  const uploads = [ 'a.txt' ];
  const deletes = [ 'b.txt' ];
  const localPrefix = `${__dirname}/mock/local-filesystem`;

  beforeAll(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());
    mockS3 = new S3();
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  test('it deploys', async () => {

    expect.assertions(2);

    return deploy(mockS3, 'foo', uploads, deletes, localPrefix).then(({ uploaded, deleted }) => {

      expect(uploaded).toEqual([ 'a.txt' ]);
      expect(deleted).toEqual([ 'b.txt' ]);

    });

  });

  test('it deploys into destination prefix as instructed', async () => {

    expect.assertions(2);

    return deploy(mockS3, 'foo', uploads, deletes, localPrefix, 'some/nested/folder').then(({ uploaded, deleted }) => {

      expect(uploaded).toEqual([ 'some/nested/folder/a.txt' ]);
      expect(deleted).toEqual([ 'some/nested/folder/b.txt' ]);

    });

  });

  test('it sends the correct delete params', async () => {

    expect.assertions(2);

    return deploy(mockS3, 'foo', uploads, deletes, localPrefix).then(({ deleted }) => {

      expect(mockS3.lastDeleteParams.Bucket).toEqual('foo');
      expect(mockS3.lastDeleteParams.Delete.Objects).toEqual(deleted.map((Key) => ({ Key })));

    });

  });

  test('it sends the correct upload params', async () => {

    expect.assertions(6);

    return deploy(mockS3, 'foo', uploads, deletes, localPrefix).then(({ uploaded }) => {

      expect(mockS3.lastUploadParams.ACL).toBeUndefined();
      expect(mockS3.lastUploadParams.Body).toBeInstanceOf(fs.ReadStream);
      expect(mockS3.lastUploadParams.CacheControl).toBeUndefined();
      expect(mockS3.lastUploadParams.ContentLength).toBe(2);
      expect(mockS3.lastUploadParams.ContentType).toBe('text/plain');
      expect(mockS3.lastUploadParams.Key).toBe(uploaded[0]);

    });

  });

  test('it sends the correct upload params with custom behaviour', async () => {

    expect.assertions(6);

    return deploy(mockS3, 'foo', uploads, deletes, localPrefix, '', 'public-read', [ uploads[0] ]).then(({ uploaded }) => {

      expect(mockS3.lastUploadParams.ACL).toBe('public-read');
      expect(mockS3.lastUploadParams.Body).toBeInstanceOf(fs.ReadStream);
      expect(mockS3.lastUploadParams.CacheControl).toBe('no-cache');
      expect(mockS3.lastUploadParams.ContentLength).toBe(2);
      expect(mockS3.lastUploadParams.ContentType).toBe('text/plain');
      expect(mockS3.lastUploadParams.Key).toBe(uploaded[0]);

    });

  });

  test('it sends the correct cache-control params', async () => {

    expect.assertions(1);

    const localUploads = ['static/a.js', 'static/subfolder/b.js', 'static/c.css', 'a.txt'];

    return deploy(mockS3, 'foo', localUploads, deletes, localPrefix, '', 'public-read', [], ['static/**/*.js=max-age:300', 'a.txt=no-cache']).then(() => {
      const cacheControlByAWSKey = {};
      mockS3.uploadCalls.forEach((call) => {
        cacheControlByAWSKey[call.Key] = call.CacheControl;
      });
      expect(cacheControlByAWSKey).toEqual({
        'static/a.js': 'max-age:300',
        'static/subfolder/b.js': 'max-age:300',
        'static/c.css': undefined,
        'a.txt': 'no-cache'
      });
    });
  });

});
