#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const options = require('../src/options').argv

const changeset = require('../src/changeset');
const cloudFront = require('../src/s3')();
const deploy = require('../src/deploy');
const deployConfirmation = require('../src/deployConfirmation');
const invalidate = require('../src/invalidate');
const invalidateConfirmation = require('../src/invalidateConfirmation');
const logger = require('../src/logger')(options);
const s3 = require('../src/s3')();
const softDeleteLifecycle = require('../src/softDeleteLifecycle');
const stale = require('../src/stale');
const summarize = require('../src/summarize');

changeset(logger, s3, options)
  .then(({ added, deleted, modified }) => deployConfirmation(logger, added, modified, deleted, options))
  .then(({ added, deleted, modified }) => (
    softDeleteLifecycle(logger, s3, deleted, options)
      .then(() => deploy(logger, s3, added, modified, deleted, options))
  ))
  .then(({ added, deleted, modified }) => (
    stale(modified, deleted, options)
      .then((stale) => invalidateConfirmation(logger, stale, options))
      .then((stale) => invalidate(logger, cloudFront, stale, options))
      .then((invalidated) => ({ added, deleted, invalidated, modified }))
  ))
  .then(({ added, deleted, invalidated, modified }) => summarize(logger, added, modified, deleted, invalidated, options))
  .catch(({ message, ...rest }) => {
    logger.error(message, rest);
    process.exitCode = 1;
  });
