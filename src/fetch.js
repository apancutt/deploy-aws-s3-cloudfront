const fastGlob = require('fast-glob');
const md5File = require('md5-file');
const { debug } = require('./log');
const { sanitizeFileSystemPrefix, sanitizeS3Prefix } = require('./utils');

const localObjects = async (path, exclude = undefined) => {

  debug(`Fetching local objects from ${path}`);

  return fastGlob('**', {
    cwd: path,
    dot: true,
    ignore: exclude,
  }).then((keys) => {

    const results = {};

    keys.forEach((key) => {
      results[key] = md5File.sync(path + key);
    });

    return results;

  });

};

const remoteObjects = async (s3, bucket, path) => {

  debug(`Fetching remote objects from s3://${bucket}/${path}`);

  const results = {};

  const fetch = (params) => (

    s3.listObjectsV2({
      ...params,
      Bucket: bucket,
      Prefix: path,
    }).promise().then((response) => {

      response.Contents.forEach((content) => {
        results[content.Key.replace(path, '')] = content.ETag.replace(/"/g, '');
      });

      if (response.IsTruncated) {
        return fetch({ ContinuationToken: response.NextContinuationToken });
      }

    })

  );

  return fetch().then(() => results);

};

module.exports = async (s3, bucket, localPrefix = '.', remotePrefix = '', exclude = undefined) => {

  localPrefix = sanitizeFileSystemPrefix(localPrefix);
  remotePrefix = sanitizeS3Prefix(remotePrefix);

  return Promise.all([
    localObjects(localPrefix, exclude),
    remoteObjects(s3, bucket, remotePrefix),
  ]).then(([ local, remote ]) => ({ local, remote }));

};
