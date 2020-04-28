const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

module.exports = yargs
  .usage('$0 [options]', 'Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.')
  .option('acl', {
    coerce: (arg) => arg.reduce((previous, current) => {
      const [ pattern, value ] = current.split(':', 2);
      return { ...previous, [pattern]: value };
    }, {}),
    default: [],
    describe: 'Set canned ACL values for S3 path(s)',
    requiresArg: true,
    type: 'array',
  })
  .option('bucket', {
    demand: true,
    describe: 'AWS S3 bucket name to deploy to',
    requiresArg: true,
    type: 'string',
  })
  .option('cache-control', {
    coerce: (arg) => arg.reduce((previous, current) => {
      const [ pattern, value ] = current.split(':', 2);
      return { ...previous, [pattern]: value };
    }, {}),
    default: [],
    describe: 'Set CacheControl values for S3 path(s)',
    requiresArg: true,
    type: 'array',
  })
  .option('delete', {
    default: false,
    describe: 'Delete objects in AWS S3 that do not exist locally',
    type: 'boolean',
  })
  .option('destination', {
    coerce: (arg) => {
      if (!arg.startsWith('/')) {
        arg = `/${arg}`;
      }
      if (!arg.endsWith('/')) {
        arg += '/';
      }
      return arg;
    },
    default: '/',
    describe: 'Path to remote directory to sync to',
    requiresArg: true,
    type: 'string',
  })
  .option('distribution', {
    describe: 'AWS CloudFront distribution ID to invalidate',
    requiresArg: true,
    type: 'string',
  })
  .option('exclude', {
    default: [],
    describe: 'Patterns to exclude from deployment',
    requiresArg: true,
    type: 'array',
  })
  .option('invalidation-paths', {
    default: [],
    describe: 'Set the invalidation path(s) (URL-encoded if necessary) instead of automatically detecting objects to invalidate',
    requiresArg: true,
    type: 'array',
  })
  .option('non-interactive', {
    default: false,
    describe: 'Do not prompt for confirmation',
    type: 'boolean',
  })
  .option('react', {
    default: false,
    describe: 'Use recommended settings for create-react-apps',
    type: 'boolean',
  })
  .option('soft-delete', {
    default: false,
    describe: 'Soft-delete objects in AWS S3 that do not exist locally by tagging them for expiration using a lifecycle policy',
    type: 'boolean',
  })
  .option('soft-delete-lifecycle-expiration', {
    default: 90,
    describe: 'Number of days after creation that soft-deleted objects are removed',
    requiresArg: true,
    type: 'integer',
  })
  .option('soft-delete-lifecycle-id', {
    default: 'Soft-Delete',
    describe: 'ID of soft-delete lifecycle rule',
    requiresArg: true,
    type: 'string',
  })
  .option('soft-delete-lifecycle-tag-key', {
    default: 'deleted',
    describe: 'Tag key used to mark objects as soft-deleted',
    requiresArg: true,
    type: 'string',
  })
  .option('soft-delete-lifecycle-tag-value', {
    default: 'true',
    describe: 'Tag value used to mark objects as soft-deleted',
    requiresArg: true,
    type: 'string',
  })
  .option('source', {
    coerce: (arg) => {
      if (!path.isAbsolute(arg)) {
        arg = path.resolve(arg);
      }
      if (!arg.endsWith(path.sep)) {
        arg += path.sep;
      }
      return arg;
    },
    default: '.',
    describe: 'Path to local directory to sync from',
    requiresArg: true,
    type: 'string',
  })
  .option('tags', {
    coerce: (arg) => arg.reduce((previous, current) => {
      const [ pattern, tags ] = current.split(':', 2);
      return {
        ...previous,
        [pattern]: tags.split(',').reduce((accumulator, tag) => {
          const [ key, value ] = tag.split('=', 2);
          return {
            ...accumulator,
            [key]: value,
          };
        }, previous[pattern]),
      };
    }, {}),
    default: [],
    describe: 'Tag set(s) to be applied to objects in AWS S3',
    requiresArg: true,
    type: 'array',
  })
  .option('verbose', {
    default: false,
    describe: 'Show debug information',
    type: 'boolean',
  })
  .middleware((options) => {
    if (options.react) {
      options['cache-control'] = {
        'index.html': 'no-cache',
        ...options['cache-control'],
      };
      options.source = './build/';
    }
    if (options.softDelete) {
      options.delete = true;
    }
  }, true)
  .check((options) => {
    try {
      return fs.lstatSync(options.source).isDirectory();
    } catch (err) {
      return 'Source must be a path to a directory';
    }
  })
  .argv;
