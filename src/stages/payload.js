const fs = require('fs');
const micromatch = require('micromatch');

const DELETE_LIMIT = 1000; // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

const acl = (object, acls) => {
  const match = Object.entries(acls).find(([ pattern ]) => micromatch.isMatch(object.relative, pattern));
  return match && match[1];
};

const cacheControl = (object, cacheControls) => {
  const match = Object.entries(cacheControls).find(([ pattern ]) => micromatch.isMatch(object.relative, pattern));
  return match && match[1];
};

const tagSet = (object, tags) => (
  Object.entries(tags)
    .filter(([ pattern ]) => micromatch.isMatch(object.relative, pattern))
    .reduce((accumulator, [ , tags ]) => accumulator.concat(Object.entries(tags).map(([ key, value ]) => ({ Key: key, Value: value }))), [])
);

const objectParams = (object, action, acls, cacheControls, tags) => ({
  object,
  action,
  actionParams: {
    ACL: acl(object, acls),
    CacheControl: cacheControl(object, cacheControls),
    'Content-Length': object.size,
    'Content-Type': object.type,
    Tagging: {
      TagSet: tagSet(object, tags),
    },
  },
});




const upload = (s3, bucket, objects, acls, cacheControls, tags) => (
  Promise.all(objects.map((object) => s3.upload({
    ACL: acl(object, acls),
    Body: fs.createReadStream(params.source),
    Bucket: bucket,
    CacheControl: cacheControl(object, cacheControls),
    ContentLength: params['content-length'],
    ContentType: params['content-type'],
    Key: params.destination,
    Tagging: {
      TagSet: tagSet(object, tags),
    },
  }).promise()))
);

const hardDelete = (s3, objects) => Promise.all(
  Array(Math.ceil(objects.length / DELETE_LIMIT))
    .fill()
    .map((_, index) => index * DELETE_LIMIT)
    .map((start) => objects.slice(start, start + DELETE_LIMIT))
    .map((objects) => s3.deleteObjects({
      Bucket: objects[0].bucket,
      Delete: {
        Objects: objects.map((object) => ({ Key: object.relative })),
      },
    }).promise())
);

const softDelete = (s3, items) => Promise.all(items.map((item) => s3.putObjectTagging(item.actionParams).promise()));




module.exports = (s3, addedObjects, modifiedObjects, deletedObjects, bucket, acls, cacheControls, tags, softDeleteTagKey, softDeleteTagValue, deletionPolicy) => (
  Promise.all([
    upload(s3, bucket, addedObjects.concat(modifiedObjects), acls, cacheControls, tags),
    'soft' === deletionPolicy ? softDelete(deletedObjects) : hardDelete(deletedObjects),
  ])
    .then(() => modifiedObjects.concat(deletedObjects))
);




  Promise.resolve(
  addedObjects.map((object) => objectParams(object, 'add', acls, cacheControls, tags))
    .concat(modifiedObjects.map((object) => objectParams(object, 'modify', acls, cacheControls, tags)))
    .concat(deletedObjects.map((object) => {

      const params = objectParams(object, `${deletionPolicy}-delete`, acls, cacheControls, tags);

      if ('soft' === deletionPolicy) {
        params.actionParams.Tagging.TagSet.push({
          Key: softDeleteTagKey,
          Value: softDeleteTagValue,
        });
      }

      return params;

    }))
);
