const fs = require('fs');

const DELETE_LIMIT = 1000; // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

const upload = (logger, s3, bucket, objects) => (
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

const hardDelete = (s3, items) => {
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

const softDelete = (s3, items) => Promise.all(items.map((item) => s3.putObjectTagging(item.actionParams).promise()));

module.exports = (logger, s3, payload) => {

  const stale = payload.filter((item) => 'modify' === item.action);

  return Promise.all([
    upload(s3, payload.filter((item) => 'add' === item.action).concat(stale)),
    hardDelete(s3, payload.filter((item) => 'hard-delete' === item.action)),
    softDelete(s3, payload.filter((item) => 'soft-delete' === item.action)),
  ])
    .then(() => stale);

};
