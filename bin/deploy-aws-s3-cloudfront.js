#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const AWS = require('aws-sdk');
const path = require('path');
const yargs = require('yargs');
const confirmDeploy = require('../src/confirm-deploy');
const confirmInvalidate = require('../src/confirm-invalidate');
const deploy = require('../src/deploy');
const diff = require('../src/diff');
const fetch = require('../src/fetch');
const invalidate = require('../src/invalidate');
const { debug, fatal, warn } = require('../src/log');
const payload = require('../src/payload');
const softDeleteLifecycle = require('../src/soft-delete-lifecycle');
const stale = require('../src/stale');
const summarize = require('../src/summarize');

const options = yargs
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
    conflicts: 'soft-delete',
    describe: 'Delete objects in AWS S3 that do not exist locally',
    type: 'boolean',
  })
  .option('destination', {
    describe: 'Path to remote directory to sync to',
    requiresArg: true,
    type: 'string',
    coerce: (arg) => {
      arg = arg.replace(/^\//g, '');
      if (arg && !arg.endsWith('/')) {
        arg = `${arg}/`;
      }
      return arg;
    },
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
    conflicts: 'delete',
    describe: 'Tag objects in AWS S3 that do not exist locally with "expired=true"',
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
      if (!arg.endsWith('/')) {
        arg += '/';
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
    describe: 'Tag set(s) to be applied to objects in AWS S3',
    requiresArg: true,
    type: 'array',
  })
  .middleware((options) => {
    if (options.react) {
      options['cache-control'] = {
        ['index.html']: 'no-cache',
        ...options['cache-control'],
      };
      options.source = './build/';
    }
  }, true)
  .middleware((options) => {
    if (options['delete']) {
      options['soft-delete'] = false;
    } else if (options['soft-delete']) {
      options.delete = false;
    } else {
      options.delete = false;
      options['soft-delete'] = false;
    }
  })
  .argv;

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

s3.upload = (args) => {
  args.Body = 'stream';
  console.log('UPLOAD', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};
s3.deleteObjects = (args) => {
  console.log('HARD DELETE', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};
s3.putObjectTagging = (args) => {
  console.log('SOFT DELETE', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};
cloudfront.createInvalidation = (args) => {
  console.log('INVALIDATE', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};

debug(`Fetching local objects from ${options.source}`);
debug(`Fetching remote objects from s3://${options.bucket}/${options.destination}`);

fetch(s3, options)
  .then(({ local, remote }) => diff(local, remote))
  .then(({ added, deleted, modified }) => payload(added, modified, deleted, options))
  .then((payload) => (
    confirmDeploy(payload, options)
      .then((confirmed) => {
        if (!confirmed) {
          warn('Deployment aborted');
          payload = {};
        }
        return payload;
      })
  ))
  .then((payload) => (
    options['soft-delete']
      ? softDeleteLifecycle(s3, options).then(() => payload)
      : payload
  ))
  .then((payload) => deploy(s3, payload, options))
  .then(({ uploaded, deleted }) => stale(uploaded, deleted, options).then((stale) => ({ uploaded, deleted, stale }))
  .then(({ uploaded, deleted, stale }) => (
    confirmInvalidate(stale, options)
      .then((confirmed) => {
        if (!confirmed) {
          warn('Invalidation aborted');
          stale = [];
        }
        return { uploaded, deleted, stale };
      })
  ))
  .then(({ uploaded, deleted, stale }) => (
    invalidate(cloudfront, stale, options))
      .then((invalidated) => ({ uploaded, deleted, invalidated }))
  ))
  .then(({ uploaded, deleted, invalidated }) => summarize(uploaded, deleted, invalidated, options))
  .catch((err) => fatal(err.message));
