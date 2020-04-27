const LocalObject = require('../LocalObject');
const RemoteObject = require('../RemoteObject');

module.exports = (s3, logger, source, exclude, bucket, destination) => Promise.all([
  LocalObject.find(source, exclude).then((objects) => {
    objects.forEach((object) => {
      logger.debug(`Found local file: ${object.relative}`);
    })
    return objects;
  }),
  RemoteObject.find(s3, bucket, destination).then((objects) => {
    objects.forEach((object) => {
      logger.debug(`Found remote object: ${object.relative}`);
    });
    return objects;
  }),
]);
