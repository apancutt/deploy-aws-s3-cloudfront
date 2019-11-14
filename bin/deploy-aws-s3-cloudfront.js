#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const AWS = require('aws-sdk');
const PromptConfirm = require('prompt-confirm');
const yargs = require('yargs');

const deploy = require('../src/deploy');
const diff = require('../src/diff');
const fetch = require('../src/fetch');
const invalidate = require('../src/invalidate');
const { fatal, info, warn } = require('../src/log');

const argv = yargs
  .usage('$0 [options]', 'Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.')
  .option('acl', {
    type: 'string',
    describe: 'A canned ACL string',
  })
  .option('bucket', {
    type: 'string',
    demand: true,
    describe: 'AWS S3 bucket name to deploy to',
  })
  .option('delete', {
    type: 'boolean',
    describe: 'Delete files from AWS S3 that do not exist locally',
    default: false,
  })
  .option('destination', {
    type: 'string',
    demand: true,
    describe: 'Path to remote directory to sync to',
    default: '/',
  })
  .option('distribution', {
    type: 'string',
    describe: 'AWS CloudFront distribution ID to invalidate',
  })
  .option('exclude', {
    type: 'array',
    describe: 'Patterns to exclude from deployment',
    default: [],
  })
  .option('invalidation-path', {
    type: 'string',
    describe: 'Set the invalidation path (URL-encoded if necessary) instead of automatically detecting objects to invalidate',
  })
  .option('non-interactive', {
    type: 'boolean',
    describe: 'Do not prompt for confirmation',
    default: false,
  })
  .option('source', {
    type: 'string',
    describe: 'Path to local directory to sync from',
    default: '.',
  })
  .argv;

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

fetch(s3, argv.bucket, argv.source, argv.destination, argv.exclude)
  .then(({ local, remote }) => diff(local, remote, !argv.delete))
  .then(({ added, modified, deleted }) => {

    const uploads = added.concat(modified);
    const deletes = deleted;

    return (!argv.nonInteractive && (uploads.length || deletes.length) ? new PromptConfirm('Continue deployment?').run() : Promise.resolve(true)).then((answer) => {

      if (!answer) {
        warn('Abandoning deployment');
        return { uploads: [], deletes: [] };
      }

      return { uploads, deletes };

    });

  })
  .then(({ uploads, deletes }) => deploy(s3, argv.bucket, uploads, deletes, argv.source, argv.destination, argv.acl))
  .then((keys) => (argv.distribution ? invalidate(cloudfront, argv.distribution, argv.invalidationPath ? [ argv.invalidationPath ] : keys, !argv.invalidationPath) : []))
  .then(() => info('Deployment complete'))
  .catch((err) => fatal(err.message));
