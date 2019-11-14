const promisable = require('./promisable');

class S3 {

  deleteObjects(params) {
    this.lastDeleteParams = params;
    return promisable();
  }

  listObjectsV2(params) {
    this.lastListObjectsV2Params = params;
    return promisable({
      Contents: [
        { Key: 'a.txt', ETag: 'abc123' },
      ],
      ContinuationToken: undefined,
      IsTruncated: false,
    });
  }

  upload(params) {
    this.lastUploadParams = params;
    return promisable();
  }

}

module.exports = S3;
