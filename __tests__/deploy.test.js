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

  const unmodified = [{
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
  }];

  beforeEach(() => {
    mockLogger = new Logger();
    mockS3 = new S3();
  });

  test('it sends the correct params and resolves with the changeset (hard-delete)', async () => {

    const resolution = await deploy(mockLogger, mockS3, added, modified, unmodified, deleted, options);

    expect(mockS3.uploadParams.length).toBe(2);
    expect(mockS3.uploadParams.map(({ Key: key }) => key)).toEqual([ added[0].path.s3, modified[0].path.s3 ]);

    expect(mockS3.deleteObjectsParams.length).toBe(1);
    expect(mockS3.deleteObjectsParams[0].Delete.Objects.map(({ Key: key }) => key)).toEqual([ deleted[0].path.s3 ]);

    expect(mockS3.putObjectTaggingParams).toBe(undefined);

    expect(added).toStrictEqual(resolution.added);
    expect(deleted).toStrictEqual(resolution.deleted);
    expect(modified).toStrictEqual(resolution.modified);
    expect(unmodified).toStrictEqual(resolution.unmodified);

  });

  test('it sends the correct params and resolves with the changeset (soft-delete)', async () => {

    await deploy(mockLogger, mockS3, added, modified, unmodified, deleted, { ...options, softDelete: true });

    expect(mockS3.uploadParams.length).toBe(2);
    expect(mockS3.uploadParams.map(({ Key: key }) => key)).toEqual([ added[0].path.s3, modified[0].path.s3 ]);

    expect(mockS3.deleteObjectsParams).toBe(undefined);

    expect(mockS3.putObjectTaggingParams.length).toBe(3);
    for (const putObjectTaggingParams of mockS3.putObjectTaggingParams) {
      if ([ modified[0].path.s3, unmodified[0].path.s3 ].includes(putObjectTaggingParams.Key)) {
        expect(putObjectTaggingParams.Tagging.TagSet.length).toBe(0);
      } else if (deleted[0].path.s3 === putObjectTaggingParams.Key) {
        expect(putObjectTaggingParams.Tagging.TagSet.length).toBe(1);
        expect(putObjectTaggingParams.Tagging.TagSet[0].Key).toBe('deleted');
        expect(putObjectTaggingParams.Tagging.TagSet[0].Value).toBe('true');
      } else {
        throw new Error(`Tags modified on unexpected key: ${putObjectTaggingParams.Key}`);
      }
    }

  });

});
