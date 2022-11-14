const fs = require('fs');
const qs = require('querystring');

const DELETE_LIMIT = 1000; // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

const upload = (logger, s3, objects, options) => Promise.all(objects.map((object) => {

  logger.debug(`Uploading ${object.path.relative}...`, { object });

  return s3.upload({
    ACL: object.acl,
    Body: fs.createReadStream(object.path.local),
    Bucket: options.bucket,
    CacheControl: object.cacheControl,
    ContentLength: object.contentLength,
    ContentType: object.contentType,
    Key: object.path.s3,
    Tagging: qs.stringify(object.tagSet) || undefined,
  }).promise();

}));

const hardDelete = (logger, s3, objects, options) => Promise.all(
  Array(Math.ceil(objects.length / DELETE_LIMIT))
    .fill()
    .map((_, index) => index * DELETE_LIMIT)
    .map((start) => objects.slice(start, start + DELETE_LIMIT))
    .map((objects) => {

      logger.debug(`Hard-deleting ${objects.length} objects...`, { objects });

      return s3.deleteObjects({
        Bucket: options.bucket,
        Delete: {
          Objects: objects.map((object) => ({ Key: object.path.s3 })),
        },
      }).promise();

    })
);

const removeSoftDelete = (logger, s3, objects, options) => Promise.all(objects.map((object) => {

  logger.debug(`Removing soft-delete to ${objects.length} objects...`, { objects });

  return s3.putObjectTagging({
    Bucket: options.bucket,
    Key: object.path.s3,
    Tagging: {
      TagSet: Object.entries({
        ...object.tagSet,
      }).map(([ key, value ]) => ({ Key: key, Value: value })),
    },
  }).promise();

}));

const softDelete = (logger, s3, objects, options) => Promise.all(objects.map((object) => {

  logger.debug(`Soft-deleting ${objects.length} objects...`, { objects });

  return s3.putObjectTagging({
    Bucket: options.bucket,
    Key: object.path.s3,
    Tagging: {
      TagSet: Object.entries({
        ...object.tagSet,
        [options.softDeleteTagKey]: options.softDeleteTagValue,
      }).map(([ key, value ]) => ({ Key: key, Value: value })),
    },
  }).promise();

}));

module.exports = (logger, s3, added, modified, deleted, unchanged, options) => (
  Promise.all([
    upload(logger, s3, added.concat(modified), options),
    options.softDelete ? removeSoftDelete(logger, s3, modified.concat(unchanged), options) : Promise.resolve(true),
    options.softDelete ? softDelete(logger, s3, deleted, options) : hardDelete(logger, s3, deleted, options),
  ])
    .then(() => ({ added, modified, deleted, unchanged }))
);
