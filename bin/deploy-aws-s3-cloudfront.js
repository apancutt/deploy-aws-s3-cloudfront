#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const AWS = require('aws-sdk');
const winston = require('winston');

const changeset = require('../src/changeset');
const deploy = require('../src/deploy');
const deployConfirmation = require('../src/deployConfirmation');
const invalidate = require('../src/invalidate');
const invalidateConfirmation = require('../src/invalidateConfirmation');
const options = require('../src/options');
const softDeleteLifecycle = require('../src/softDeleteLifecycle');
const stale = require('../src/stale');
const summarize = require('../src/summarize');

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

const logger = winston.createLogger({
  level: options.verbose ? 'debug' : 'info',
  transports: [ new winston.transports.Console({ format: winston.format.cli() }) ],
});

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
s3.putBucketLifecycleConfiguration = (args) => {
  console.log('LIFECYCLE', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};
cloudfront.createInvalidation = (args) => {
  console.log('INVALIDATE', JSON.stringify(args));
  return { promise: () => Promise.resolve() };
};


changeset(s3, options)
  .then(({ added, deleted, modified }) => deployConfirmation(logger, added, modified, deleted, options))
  .then(({ added, deleted, modified }) => (
    softDeleteLifecycle(s3, deleted, options)
      .then(() => deploy(s3, added, modified, deleted, options))
  ))
  .then(({ added, deleted, modified }) => (
    stale(modified, deleted, options)
      .then((stale) => invalidateConfirmation(logger, stale, options))
      .then((stale) => invalidate(cloudfront, stale, options))
      .then((invalidated) => ({ added, deleted, invalidated, modified }))
  ))
  .then(({ added, deleted, invalidated, modified }) => summarize(logger, added, modified, deleted, invalidated, options))
  .catch((err) => {
    logger.error(err.message);
    process.exitCode = 1;
  });
