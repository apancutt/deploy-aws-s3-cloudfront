const path = require('path');

const sanitizeFileSystemPrefix = (prefix) => {

  if (!path.isAbsolute(prefix)) {
    prefix = path.resolve(prefix);
  }

  if (!prefix.endsWith('/')) {
    prefix += '/';
  }

  return prefix;

};

const sanitizeS3Prefix = (prefix) => {

  if (!prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }

  if (!prefix.endsWith('/')) {
    prefix += '/';
  }

  return prefix;

}

const encodeCloudFrontKey = (key) => (
  encodeURIComponent(key)
    .replace(/~/g, '%7E')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
);

const sanitizeCloudFrontKey = (path) => (
  `/${path}`.replace(/%2F/g, '/').replace(/\/+/g, '/')
);

module.exports = {
  encodeCloudFrontKey,
  sanitizeCloudFrontKey,
  sanitizeFileSystemPrefix,
  sanitizeS3Prefix,
};
