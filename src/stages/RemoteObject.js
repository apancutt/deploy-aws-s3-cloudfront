const AbstractObject = require('./AbstractObject');

module.exports = class RemoteObject extends AbstractObject {

  constructor(bucket, cwd, relative, checksum) {
    super(cwd, relative, checksum);
    this.bucket = bucket;
  }

  get s3path() {
    return `s3://${this.bucket}${this.absolute}`;
  }

  get invalidationURL() {

    let url = encodeURIComponent(this.relativePath)
      .replace(/~/g, '%7E')
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%2F/g, '/') // Restore slashes

    if (!url.startsWith('/')) {
      url = `/${url}`;
    }

    return url;

  }

  static find(s3, bucket, cwd = '/') {

    const prefix = cwd.replace(/^\//, '');
    const keyToRelativePath = (key) => prefix ? key.replace(new RegExp(`^${prefix}`), '') : key;

    const fetch = (params, objects = []) => (
      s3.listObjectsV2({
        ...params,
        Bucket: bucket,
        Prefix: prefix,
      })
        .promise()
        .then((response) => {

          objects = objects.concat(response.Contents.map((content) => new this(
            bucket,
            cwd,
            keyToRelativePath(content.Key),
            content.ETag.replace(/"/g, '')
          )));

          if (response.IsTruncated) {
            return fetch({ ContinuationToken: response.NextContinuationToken }, objects);
          }

          return objects;

        })
    );

    return fetch();

  }

}
