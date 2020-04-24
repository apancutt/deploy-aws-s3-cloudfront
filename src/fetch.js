const fastGlob = require('fast-glob');
const md5File = require('md5-file');

const local = (prefix, exclude = undefined) => (
  fastGlob('**', {
    cwd: prefix,
    dot: true,
    ignore: exclude,
  })
    .then((matches) => matches.reduce((accumlator, key) => ({
      ...accumlator,
      [key]: md5File.sync(prefix + key),
    }), {}))
);

const remote = (s3, bucket, prefix) => {

  const results = {};

  const fetch = (params) => (

    s3.listObjectsV2({
      ...params,
      Bucket: bucket,
      Prefix: prefix,
    }).promise().then((response) => {

      response.Contents.forEach((content) => {
        results[content.Key.replace(prefix, '')] = content.ETag.replace(/"/g, '');
      });

      if (response.IsTruncated) {
        return fetch({ ContinuationToken: response.NextContinuationToken });
      }

    })

  );

  return fetch().then(() => results);

};

module.exports = (s3, options) => Promise.all([
  local(options.source, options.exclude),
  remote(s3, options.bucket, options.destination),
])
  .then(([ local, remote ]) => ({ local, remote }));
