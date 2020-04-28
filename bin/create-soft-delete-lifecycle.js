#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */

const options = require('../src/options').argv

const logger = require('../src/logger')(options);
const s3 = require('../src/s3')();
const softDeleteLifecycle = require('../src/softDeleteLifecycle');

softDeleteLifecycle(logger, s3, options)
  .catch(({ message, ...rest }) => {
    logger.error(message, rest);
    process.exitCode = 1;
  });
