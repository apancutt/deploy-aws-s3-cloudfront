const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const changeset = require('../src/changeset');
const options = require('./mock/options')['default']().argv;

describe('changeset', () => {

  let mockLogger;
  let mockS3;

  beforeAll(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it ignores deleted', async () => {

    expect.assertions(3);

    return changeset(mockLogger, mockS3, options).then(({ added, deleted, modified }) => {

      expect(added).toEqual([{
        acl: undefined,
        cacheControl: undefined,
        contentLength: 21,
        contentType: 'text/plain',
        path: {
          cloudFront: '/test/local.txt',
          local: `${options.source}local.txt`,
          relative: 'local.txt',
          s3: 'test/local.txt',
        },
        tagSet: {},
      }]);

      expect(modified).toEqual([{
        acl: undefined,
        cacheControl: undefined,
        contentLength: 24,
        contentType: 'text/plain',
        path: {
          cloudFront: '/test/modified.txt',
          local: `${options.source}modified.txt`,
          relative: 'modified.txt',
          s3: 'test/modified.txt',
        },
        tagSet: {},
      }]);

      expect(deleted).toEqual([]);

    });

  });

  test('it ignores deleted (hard-delete + retain)', async () => {

    expect.assertions(1);

    return changeset(mockLogger, mockS3, { ...options, delete: true, retain: ["*remote*"] }).then(({ deleted }) => {
      expect(deleted).toEqual([]);
    });

  });

  test('it includes deleted (hard-delete)', async () => {

    expect.assertions(1);

    return changeset(mockLogger, mockS3, { ...options, delete: true }).then(({ deleted }) => {

      expect(deleted).toEqual([{
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
        tagSet: {},
      }]);


    });

  });

  test('it includes deleted (soft-delete)', async () => {

    expect.assertions(1);

    return changeset(mockLogger, mockS3, { ...options, softDelete: true }).then(({ deleted }) => {

      expect(deleted).toEqual([{
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
        tagSet: {},
      }]);


    });

  });

});
