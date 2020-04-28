const promisable = require('./promisable');

class S3 {

  deleteObjects(params) {
    this.lastDeleteParams = params;
    return promisable();
  }

  getBucketLifecycleConfiguration(params) {
    this.lastGetBucketLifecycleConfigurationParams = params;
    const err = new Error();
    err.code = 'NoSuchLifecycleConfiguration';
    return promisable(Promise.reject(err));
  }

  listObjectsV2(params) {
    this.lastListObjectsV2Params = params;
    return promisable({
      Contents: [
        { Key: 'modified.txt', ETag: 'testtesttesttesttesttesttesttest' },
        { Key: 'unmodified.txt', ETag: '9c987af8bff0bc97a19af3df860a6ce8' },
        { Key: 'remote.txt', ETag: 'testtesttesttesttesttesttesttest' },
      ],
      ContinuationToken: undefined,
      IsTruncated: false,
    });
  }

  putBucketLifecycleConfiguration(params) {
    this.lastPutBucketLifecycleConfigurationParams = params;
    return promisable();
  }

  putObjectTagging(params) {
    this.lastPutObjectTaggingParams = params;
    return promisable();
  }

  upload(params) {
    this.lastUploadParams = params;
    return promisable();
  }

}

module.exports = S3;
