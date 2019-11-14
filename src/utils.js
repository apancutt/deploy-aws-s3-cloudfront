const path = require('path');

/**
 * Returns the absolute path with a trailing slash.
 */
const sanitizeFileSystemPrefix = (prefix) => {

  if (!path.isAbsolute(prefix)) {
    prefix = path.resolve(prefix);
  }

  if (!prefix.endsWith('/')) {
    prefix += '/';
  }

  return prefix;

};

/**
 * Remove leading slash but ensure a non-empty prefix has a trailing slash.
 */
const sanitizeS3Prefix = (prefix) => {

  prefix = prefix.replace(/^\//g, '');

  if (prefix && !prefix.endsWith('/')) {
    prefix = `${prefix}/`;
  }

  return prefix;

}

/**
 * Invalidation paths must be encoded as per RFC1738.
 */
const encodeCloudFrontKey = (key) => (
  encodeURIComponent(key)
    .replace(/~/g, '%7E')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
);

/**
 * Unencode slashes and ensure path contains a leading slash.
 */
const sanitizeCloudFrontKey = (path) => {

  path = path.replace(/%2F/g, '/');

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return path;

};

module.exports = {
  encodeCloudFrontKey,
  sanitizeCloudFrontKey,
  sanitizeFileSystemPrefix,
  sanitizeS3Prefix,
};
