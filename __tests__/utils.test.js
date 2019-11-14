const { encodeCloudFrontKey, sanitizeCloudFrontKey, sanitizeFileSystemPrefix, sanitizeS3Prefix } = require('../src/utils');

describe('utils', () => {

  test('it encodes CloudFront keys', () => {

    expect(encodeCloudFrontKey('foo')).toEqual('foo');
    expect(encodeCloudFrontKey('~')).toEqual('%7E');

  });

  test('it sanitizes CloudFront keys', () => {

    expect(sanitizeCloudFrontKey('foo')).toEqual('/foo');
    expect(sanitizeCloudFrontKey('%2Ffoo')).toEqual('/foo');
    expect(sanitizeCloudFrontKey('//foo')).toEqual('/foo');

  });

  test('it sanitizes filesystem prefixes', () => {

    expect(sanitizeFileSystemPrefix('/a')).toEqual('/a/');
    expect(sanitizeFileSystemPrefix('a')).toEqual(`${process.cwd()}/a/`);

  });

  test('it sanitizes S3 prefixes', () => {

    expect(sanitizeS3Prefix('/')).toEqual('');
    expect(sanitizeS3Prefix('/a')).toEqual('a/');
    expect(sanitizeS3Prefix('a')).toEqual('a/');

  });

});
