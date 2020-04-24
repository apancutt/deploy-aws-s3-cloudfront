const fs = require('fs');

const DELETE_LIMIT = 1000; // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

const tagSet = (tags) => Object.entries(tags || {}).map(([ key, value ]) => ({ Key: key, Value: value }));

const upload = (s3, bucket, objects) => (
  Promise.all(Object.entries(objects).map(([ , params ]) => s3.upload({
    ACL: params.acl,
    Body: fs.createReadStream(params.source),
    Bucket: bucket,
    CacheControl: params['cache-control'],
    ContentLength: params['content-length'],
    ContentType: params['content-type'],
    Key: params.destination,
    Tagging: {
      TagSet: tagSet(params.tags),
    },
  }).promise()))
);

const hardDelete = (s3, bucket, objects) => {
  objects = Object.entries(objects);
  return Promise.all(
    Array(Math.ceil(objects.length / DELETE_LIMIT))
      .fill()
      .map((_, index) => index * DELETE_LIMIT)
      .map((start) => objects.slice(start, start + DELETE_LIMIT))
      .map((batch) => s3.deleteObjects({
        Bucket: bucket,
        Delete: {
          Objects: batch.map(([ , params ]) => ({ Key: params.destination })),
        },
      }).promise())
  );
};

const softDelete = (s3, bucket, objects) => (
  Promise.all(Object.entries(objects).map(([ , params ]) => s3.putObjectTagging({
    Bucket: bucket,
    Key: params.destination,
    Tagging: {
      TagSet: tagSet(params.tags),
    },
  }).promise()))
);

module.exports = (s3, payload, options) => {

  const uploaded = {};
  const deleted = {};

  Object.entries(payload).forEach(([ key, params ]) => {
    if (params.source) {
      uploaded[key] = params;
    } else {
      deleted[key] = params;
    }
  });

  return Promise.all([
    upload(s3, options.bucket, uploaded).then(() => uploaded),
    (options['soft-delete'] ? softDelete(s3, options.bucket, deleted) : hardDelete(s3, options.bucket, deleted)).then(() => deleted),
  ])
    .then(() => ({ uploaded, deleted }));

};
