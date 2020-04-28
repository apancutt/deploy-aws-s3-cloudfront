const fastGlob = require('fast-glob');
const fs = require('fs');
const md5File = require('md5-file');
const micromatch = require('micromatch');
const mimeTypes = require('mime-types');

const localNames = (options) => fastGlob('**', {
  cwd: options.source,
  dot: true,
  ignore: options.exclude,
});

const remoteNamesAndChecksums = (s3, options) => {

  const prefix = options.destination.replace(/^\//, '');
  const keyToRelativePath = (key) => prefix ? key.replace(new RegExp(`^${prefix}`), '') : key;

  const fetch = (params = {}, objects = {}) => (
    s3.listObjectsV2({
      ...params,
      Bucket: options.bucket,
      Prefix: prefix,
    })
      .promise()
      .then((response) => {

        response.Contents.forEach((content) => {
          objects[keyToRelativePath(content.Key)] = content.ETag.replace(/"/g, '');
        });

        if (response.IsTruncated) {
          return fetch({ ContinuationToken: response.NextContinuationToken }, objects);
        }

        return objects;

      })
  );

  return fetch();

}

const acl = (name, acls) => (Object.entries(acls).find(([ pattern ]) => micromatch.isMatch(name, pattern)) || [])[1];

const cacheControl = (name, cacheControls) => (Object.entries(cacheControls).find(([ pattern ]) => micromatch.isMatch(name, pattern)) || [])[1];

const tagSet = (name, tags) => (
  Object.entries(tags)
    .filter(([ pattern ]) => micromatch.isMatch(name, pattern))
    .reduce((accumulator, [ , tags ]) => accumulator.concat(Object.entries(tags).map(([ key, value ]) => ({ Key: key, Value: value }))), [])
);

const info = (name, deleted, options) => {

  let props = {
    acl: acl(name, options.acl),
    cacheControl: cacheControl(name, options.cacheControl),
    path: {
      relative: name,
      local: options.source + name,
      s3: options.destination.replace(/^\//, '') + name,
      cloudfront: encodeURIComponent(options.destination + name)
        .replace(/~/g, '%7E')
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%2F/g, '/'),
    },
    tagSet: tagSet(name, options.tags),
  };

  if (!deleted) {
    props = {
      ...props,
      contentLength: fs.statSync(props.path.local).size,
      contentType: mimeTypes.lookup(props.path.local) || 'application/octet-stream',
    };
  }

  return props;

};

module.exports = (s3, options) => Promise.all([
  localNames(options),
  remoteNamesAndChecksums(s3, options),
])
  .then(([ localNames, remoteNamesAndChecksums ]) => ({
    added: localNames
      .filter((name) => !(name in remoteNamesAndChecksums))
      .map((name) => info(name, false, options)),
    modified: localNames
      .filter((name) => name in remoteNamesAndChecksums)
      .filter((name) => md5File.sync(options.source + name) !== remoteNamesAndChecksums[name])
      .map((name) => info(name, false, options)),
    deleted: !options.delete ? [] : Object.keys(remoteNamesAndChecksums)
      .filter((name) => !localNames.includes(name))
      .map((name) => info(name, true, options)),
  }));
