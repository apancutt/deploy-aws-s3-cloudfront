const fastGlob = require('fast-glob');
const fs = require('fs');
const md5File = require('md5-file');
const micromatch = require('micromatch');
const mimeTypes = require('mime-types');

const localNames = (logger, options) => {

  logger.debug(`Fetching ${options.source}...`, {
    ignore: options.exclude,
  });

  return fastGlob('**', {
    cwd: options.source,
    dot: true,
    ignore: options.exclude,
  });

};

const remoteNamesAndChecksums = (logger, s3, options) => {

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

  logger.debug(`Fetching s3://${options.bucket}${options.destination}...`);

  return fetch();

}

const acl = (name, acls) => (Object.entries(acls).find(([ pattern ]) => micromatch.isMatch(name, pattern)) || [])[1];

const cacheControl = (name, cacheControls) => (Object.entries(cacheControls).find(([ pattern ]) => micromatch.isMatch(name, pattern)) || [])[1];

const tagSet = (name, tags) => (
  Object.entries(tags)
    .filter(([ pattern ]) => micromatch.isMatch(name, pattern))
    .reduce((accumulator, [ , tags ]) => ({
      ...accumulator,
      ...tags,
    }), {})
);

const info = (name, deleted, options) => {

  let props = {
    acl: acl(name, options.acl),
    cacheControl: cacheControl(name, options.cacheControl),
    path: {
      relative: name,
      local: options.source + name,
      s3: options.destination.replace(/^\//, '') + name,
      cloudFront: encodeURIComponent(options.destination + name)
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

const exists = (logger, name, localNames, remoteNamesAndChecksums) => {

  const locally = localNames.includes(name);
  const remotely = name in remoteNamesAndChecksums;

  if (locally && remotely) {
    logger.debug(`${name} exists locally and remotely`);
  } else if (locally) {
    logger.debug(`${name} exists locally only`);
  } else {
    logger.debug(`${name} exists remotely only`);
  }

  return { locally, remotely };

};

const differ = (logger, name, localChecksum, remoteChecksum) => {

  if (localChecksum === remoteChecksum) {
    logger.debug(`${name} checksums match`, {
      local: localChecksum,
      remote: remoteChecksum,
    });
    return false;
  }

  logger.debug(`${name} checksums differ`, {
    local: localChecksum,
    remote: remoteChecksum,
  });

  return true;

};

module.exports = (logger, s3, options) => Promise.all([
  localNames(logger, options),
  remoteNamesAndChecksums(logger, s3, options),
])
  .then(([ localNames, remoteNamesAndChecksums ]) => {

    const added = [];
    const modified = [];
    const deleted = [];

    localNames
      .concat(Object.keys(remoteNamesAndChecksums))
      .filter((element, index, array) => array.indexOf(element) === index)
      .forEach((name) => {

        const existence = exists(logger, name, localNames, remoteNamesAndChecksums);

        if (!existence.remotely) {
          added.push(info(name, false, options));
        } else if (!existence.locally) {
          if (options.delete || options.softDelete) {
            deleted.push(info(name, true, options));
          }
        } else if (differ(logger, name, md5File.sync(options.source + name), remoteNamesAndChecksums[name])) {
          modified.push(info(name, false, options))
        }

      });

    return { added, deleted, modified };

  });
