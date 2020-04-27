const fs = require('fs');

const DELETE_LIMIT = 1000; // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

const upload = (s3, objects, options) => Promise.all(objects.map((object) => s3.upload({
  ACL: object.acl,
  Body: fs.createReadStream(object.path.local),
  Bucket: options.bucket,
  CacheControl: object.cacheControl,
  ContentLength: object.contentLength,
  ContentType: object.contentType,
  Key: object.path.s3,
  Tagging: {
    TagSet: object.tagSet,
  },
}).promise()));

const hardDelete = (s3, objects, options) => Promise.all(
  Array(Math.ceil(objects.length / DELETE_LIMIT))
    .fill()
    .map((_, index) => index * DELETE_LIMIT)
    .map((start) => objects.slice(start, start + DELETE_LIMIT))
    .map((objects) => s3.deleteObjects({
      Bucket: options.bucket,
      Delete: {
        Objects: objects.map((object) => ({ Key: object.path.s3 })),
      },
    }).promise())
);

const softDelete = (s3, objects, options) => Promise.all(objects.map((object) => s3.putObjectTagging({
  Bucket: options.bucket,
  Key: object.path.s3,
  Tagging: {
    TagSet: [
      ...object.tagSet,
      { [options.softDeleteLifecycleTagKey]: options.softDeleteLifecycleTagValue },
    ],
  },
}).promise()));

module.exports = (s3, added, modified, deleted, options) => (
  Promise.all([
    upload(s3, added.concat(modified), options),
    'soft' === options.delete ? softDelete(s3, deleted, options) : hardDelete(s3, deleted, options),
  ])
    .then(() => ({ added, modified, deleted }))
);
