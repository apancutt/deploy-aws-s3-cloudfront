const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const changeset = require('../src/changeset');
const options = require('./mock/options')['default']().argv;

describe('changeset', () => {

  let mockLogger;
  let mockS3;

  beforeEach(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it ignores deleted', async () => {

    const { added, deleted, modified, unmodified } = await changeset(mockLogger, mockS3, options);

    expect(added.length).toBe(1);
    expect(added[0]).toEqual({
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
    });

    expect(modified.length).toBe(1);
    expect(modified[0]).toEqual({
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
    });

    expect(unmodified.length).toBe(1);
    expect(unmodified[0]).toEqual({
      acl: undefined,
      cacheControl: undefined,
      contentLength: 27,
      contentType: 'text/plain',
      path: {
        cloudFront: '/test/unmodified.txt',
        local: `${options.source}unmodified.txt`,
        relative: 'unmodified.txt',
        s3: 'test/unmodified.txt',
      },
      tagSet: {},
    });

    expect(deleted.length).toBe(0);

  });

  test('it ignores deleted (hard-delete + retain)', async () => {

    const { deleted } = await changeset(mockLogger, mockS3, { ...options, delete: true, retain: [ '*remote*' ] });
    expect(deleted.length).toBe(0);

  });

  test('it includes deleted (hard-delete)', async () => {

    const { deleted } = await changeset(mockLogger, mockS3, { ...options, delete: true });

    expect(deleted.length).toBe(1);
    expect(deleted[0]).toEqual({
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
    });

  });

  test('it includes deleted (soft-delete)', async () => {

    const { deleted } = await changeset(mockLogger, mockS3, { ...options, softDelete: true });

    expect(deleted.length).toBe(1);
    expect(deleted[0]).toEqual({
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
    });

  });

});
