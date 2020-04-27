#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const AWS = require('aws-sdk');
const PromptConfirm = require('prompt-confirm');
const winston = require('winston');
const changeset = require('../src/changeset');
const deploy = require('../src/deploy');
const invalidate = require('../src/invalidate');
const lifecycle = require('../src/lifecycle');
const options = require('../src/options');
const summarize = require('../src/summarize');

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

const logger = winston.createLogger({
  level: 'debug',
  transports: [ new winston.transports.Console({ format: winston.format.cli() }) ],
});

const confirm = (message) => Promise.resolve(!options['non-interactive'] ? (new PromptConfirm(message)).run() : true);


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
  .then(({ added, deleted, modified }) => (
    lifecycle(s3, options)
      .then(() => deploy(s3, added, modified, deleted, options))
      .then(({ deleted, modified }) => invalidate(cloudfront, modified.concat(deleted), options))
      .then((invalidated) => ({ added, deleted, invalidated, modified }))
  ))
  .then(({ added, deleted, invalidated, modified }) => summarize(logger, added, modified, deleted, invalidated, options))
  .catch((err) => {
    logger.error(err.message);
    process.exitCode = 1;
  });
