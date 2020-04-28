const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

yargs.parserConfiguration({ 'strip-dashed': true });

module.exports = yargs
  .usage('$0 [options]', 'Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.')
  .option('acl', {
    coerce: (arg) => arg.reduce((previous, current) => {
      const [ pattern, value ] = current.split(':', 2);
      return { ...previous, [pattern]: value };
    }, {}),
    default: [],
    describe: 'Apply ACL to specific pattern(s). The first pattern to match the path is applied.',
    requiresArg: true,
    type: 'array',
  })
  .option('bucket', {
    demand: true,
    describe: 'AWS S3 bucket name to deploy to.',
    requiresArg: true,
    type: 'string',
  })
  .option('cache-control', {
    coerce: (arg) => arg.reduce((previous, current) => {
      const [ pattern, value ] = current.split(':', 2);
      return { ...previous, [pattern]: value };
    }, {}),
    default: [],
    describe: 'Apply Cache Control to specific pattern(s). The first pattern to match the path is applied.',
    requiresArg: true,
    type: 'array',
  })
  .option('debug', {
    default: false,
    describe: 'Enable output of debugging log messages.',
    type: 'boolean',
  })
  .option('delete', {
    default: false,
    describe: 'Delete objects in AWS S3 that do not exist locally. Objects are retained if both this option and soft-delete are omitted.',
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
    describe: 'Path to remote directory to sync to.',
    requiresArg: true,
    type: 'string',
  })
  .option('distribution', {
    describe: 'AWS CloudFront distribution ID to invalidate. No invalidation is performed if this option is omitted.',
    requiresArg: true,
    type: 'string',
  })
  .option('exclude', {
    default: [],
    describe: 'Pattern(s) to exclude from deployment.',
    requiresArg: true,
    type: 'array',
  })
  .option('invalidation-path', {
    default: [],
    describe: 'Set the invalidation path(s) instead of automatically detecting objects to invalidate. Paths should be absolute (with a leading slash).',
    requiresArg: true,
    type: 'array',
  })
  .option('non-interactive', {
    default: false,
    describe: 'Do not prompt for confirmations.',
    type: 'boolean',
  })
  .option('output-format', {
    choices: [ 'colorized', 'json', 'text' ],
    default: 'colorized',
    describe: 'Logging output format.',
    requiresArg: true,
    type: 'string',
  })
  .option('react', {
    default: false,
    describe: 'Use recommended settings for React applications.',
    type: 'boolean',
  })
  .option('soft-delete', {
    default: false,
    describe: 'Tag objects in AWS S3 that do not exist locally. Objects are retained if both this option and delete are omitted.',
    type: 'boolean',
  })
  .option('soft-delete-lifecycle-expiration', {
    default: 90,
    describe: 'Expiration (in days) rule for generated soft-deletion lifecycle policy.',
    requiresArg: true,
    type: 'integer',
  })
  .option('soft-delete-lifecycle-id', {
    default: 'Soft-Delete',
    describe: 'ID for generated soft-deletion lifecycle policy.',
    requiresArg: true,
    type: 'string',
  })
  .option('soft-delete-lifecycle-tag-key', {
    default: 'deleted',
    describe: 'Key used for generated soft-deletion lifecycle policy tag.',
    requiresArg: true,
    type: 'string',
  })
  .option('soft-delete-lifecycle-tag-value', {
    default: 'true',
    describe: 'Value used for generated soft-deletion lifecycle policy tag.',
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
    describe: 'Path to local directory to sync from.',
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
    describe: 'Apply tags to specific pattern(s). All patterns that match the path are applied.',
    requiresArg: true,
    type: 'array',
  })
  .middleware((options) => {
    if (options.react) {
      options.cacheControl = {
        'index.html': 'no-cache',
        ...options.cacheControl,
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
  });
