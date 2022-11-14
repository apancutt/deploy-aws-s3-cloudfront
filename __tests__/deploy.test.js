const Logger = require('./mock/logger');
const S3 = require('./mock/s3');
const deploy = require('../src/deploy');
const options = require('./mock/options')['default']().argv;

describe('deploy', () => {

  let mockS3;
  let mockLogger;

  const added = [{
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
  }];

  const deleted = [{
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
  }];

  const modified = [{
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
  }];

  const unchanged = [];

  beforeAll(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it sends the correct params and resolves with the changeset (hard-delete)', async () => {

    expect.assertions(7);

    return deploy(mockLogger, mockS3, added, modified, deleted, unchanged, options).then((resolution) => {

      expect(mockS3.lastUploadParams.Key).toEqual(modified[0].path.s3);

      expect(mockS3.lastDeleteParams.Delete.Objects.length).toEqual(deleted.length);
      expect(mockS3.lastDeleteParams.Delete.Objects[0].Key).toEqual(deleted[0].path.s3);
      expect(mockS3.lastPutObjectTaggingParams).toBeUndefined()

      expect(added).toEqual(resolution.added);
      expect(deleted).toEqual(resolution.deleted);
      expect(modified).toEqual(resolution.modified);

    });

  });

  test('it sends the correct params and resolves with the changeset (soft-delete)', async () => {

    expect.assertions(1);

    return deploy(mockLogger, mockS3, added, modified, deleted, unchanged, { ...options, softDelete: true }).then(() => {

      expect(mockS3.lastPutObjectTaggingParams.Key).toEqual(deleted[0].path.s3);

    });

  });

});
