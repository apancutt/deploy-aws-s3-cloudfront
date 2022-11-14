const promisable = require('./promisable');

class S3 {

  deleteObjects(params) {
    if (!this.deleteObjectsParams) {
      this.deleteObjectsParams = [];
    }
    this.deleteObjectsParams.push(params);
    return promisable();
  }

  getBucketLifecycleConfiguration(params) {
    if (!this.getBucketLifecycleConfigurationParams) {
      this.getBucketLifecycleConfigurationParams = [];
    }
    this.getBucketLifecycleConfigurationParams.push(params);
    const err = new Error();
    err.code = 'NoSuchLifecycleConfiguration';
    return promisable(Promise.reject(err));
  }

  listObjectsV2(params) {
    if (!this.listObjectsV2Params) {
      this.listObjectsV2Params = [];
    }
    this.listObjectsV2Params.push(params);
    return promisable({
      Contents: [
        { Key: 'test/modified.txt', ETag: 'testtesttesttesttesttesttesttest' },
        { Key: 'test/remote.txt', ETag: 'testtesttesttesttesttesttesttest' },
        { Key: 'test/unmodified.txt', ETag: '9c987af8bff0bc97a19af3df860a6ce8' },
      ],
      ContinuationToken: undefined,
      IsTruncated: false,
    });
  }

  putBucketLifecycleConfiguration(params) {
    if (!this.putBucketLifecycleConfigurationParams) {
      this.putBucketLifecycleConfigurationParams = [];
    }
    this.putBucketLifecycleConfigurationParams.push(params);
    return promisable();
  }

  putObjectTagging(params) {
    if (!this.putObjectTaggingParams) {
      this.putObjectTaggingParams = [];
    }
    this.putObjectTaggingParams.push(params);
    return promisable();
  }

  upload(params) {
    if (!this.uploadParams) {
      this.uploadParams = [];
    }
    this.uploadParams.push(params);
    return promisable();
  }

}

module.exports = S3;
