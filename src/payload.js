const fs = require('fs');
const mimeTypes = require('mime-types');

const commonParams = (key, destination, tags) => ({
  destination: destination + key,
  tags: tagsValue(key, tags),
});

const aclValue = (key, acls) => {
  const match = Object.entries(acls).find(([ pattern ]) => (
    (pattern === key)
    || (
      pattern.endsWith('*')
      && new RegExp(`^${pattern.replace(/\*?$/, '.*')}$`).test(key)
    )
  ));
  return match && match[1];
};

const cacheControlValue = (key, cacheControls) => {
  const match = Object.entries(cacheControls).find(([ pattern ]) => (
    (pattern === key)
    || (
      pattern.endsWith('*')
      && new RegExp(`^${pattern.replace(/\*?$/, '.*')}$`).test(key)
    )
  ));
  return match && match[1];
};

const tagsValue = (key, tags) => (
  Object.entries(tags)
    .filter(([ pattern ]) => (
      (pattern === key)
      || (
        pattern.endsWith('*')
        && new RegExp(`^${pattern.replace(/\*?$/, '.*')}$`).test(key)
      )
    ))
    .reduce((accumulator, [ , tags ]) => ({
      ...accumulator,
      ...tags,
    }), {})
);

module.exports = (added, modified, deleted, options) => Promise.resolve(
  added.concat(modified).reduce((accumulator, key) => ({
    ...accumulator,
    [key]: {
      ...commonParams(key, options.destination, options.tags),
      acl: aclValue(key, options.acl),
      'cache-control': cacheControlValue(key, options['cache-control']),
      'content-length': fs.statSync(options.source + key).size,
      'content-type': mimeTypes.lookup(options.source + key) || 'application/octet-stream',
      source: options.source + key,
    },
  }), ((options.delete || options['soft-delete']) ? deleted : []).reduce((accumulator, key) => {

    const params = commonParams(key, options.destination, options.tags);

    if (options['soft-delete']) {
      params.tags = {
        ...params.tags,
        [options['soft-delete-lifecycle-tag-key']]: options['soft-delete-lifecycle-tag-value'],
      };
    }

    return {
      ...accumulator,
      [key]: params,
    };

  }, {}))
);
