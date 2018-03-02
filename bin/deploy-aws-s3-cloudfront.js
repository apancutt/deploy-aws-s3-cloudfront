#!/usr/bin/env node
/**
 * Copyright (c) 2018-present, Adam Pancutt
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const aws = require('aws-sdk');
const colors = require('colors/safe');
const fastGlob = require('fast-glob');
const fs = require('fs');
const md5File = require('md5-file')
const mimeTypes = require('mime-types')
const path = require('path');
const prettyBytes = require('pretty-bytes');
const promptConfirm = require('prompt-confirm');
const querystring = require('querystring');
const yargs = require('yargs');

console.log(querystring.escape('//').replace('%2F', '/'));
process.exit();

const argv = yargs
  .usage('$0 [options]', 'Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.')
  .option('bucket', {
    type: 'string',
    demand: true,
    describe: 'AWS S3 bucket name to deploy to',
  })
  .option('distribution', {
    type: 'string',
    describe: 'AWS CloudFront distribution ID to invalidate',
  })
  .option('source', {
    type: 'string',
    demand: true,
    describe: 'Path to local directory to sync from',
    default: '.',
  })
  .option('destination', {
    type: 'string',
    demand: true,
    describe: 'Path to remote directory to sync to',
    default: '/',
  })
  .option('exclude', {
    type: 'array',
    describe: 'Patterns to exclude from deployment',
    default: [],
  })
  .option('delete', {
    type: 'boolean',
    describe: 'Delete files from AWS S3 that do not exist locally',
    default: false,
  })
  .option('profile', {
    type: 'string',
    describe: 'AWS profile to use as named in ~/.aws/credentials',
  })
  .option('non-interactive', {
    type: 'boolean',
    describe: 'Do not prompt for confirmation',
    default: false,
  })
  .argv;

if (!path.isAbsolute(argv.source)) {
  argv.source = path.resolve(argv.source);
}
argv.source = argv.source.replace(/\/$/g, '') + '/';

argv.destination = argv.destination.replace(/^\/|\/$/g, '');
if (argv.destination) {
  argv.destination += '/';
}

if (argv.profile) {
  aws.config.credentials = new aws.SharedIniFileCredentials({
    profile: argv.profile,
  });
}

colors.setTheme({
  debug: 'cyan',
  info: 'green',
  warn: 'yellow',
  error: 'red',
});

const s3 = new aws.S3();
const cloudfront = new aws.CloudFront();

fetch()
  .then((fetched) => {

    changes(fetched)
      .then((changed) => {

        if (!changed.added.length && !changed.modified.length && !changed.deleted.length) {
          console.log(colors.info('No changes detected'));
          process.exit();
        }

        const proceed = function() {
          deploy(changed.added.concat(changed.modified), changed.deleted)
            .then((deployed) => {

              invalidate(deployed.uploaded.concat(deployed.deleted))
                .then((invalidated) => {

                  console.log(colors.info('Deployment complete'));

                })
                .catch((err) => {
                  handleError(err, 'Invalidation failure (' + err.message + ')');
                });

            })
            .catch((err) => {
              handleError(err, 'Deployment failure (' + err.message + ')');
            });
        };

        if (argv.nonInteractive) {
          proceed();
        } else {
          new promptConfirm('Continue deployment?').ask((answer) => {
            if (!answer) {
              console.log(colors.warn('Deployment aborted'));
              process.exit();
            }
            proceed();
          });
        }

      })
      .catch((err) => {
        handleError(err, 'Change detection failure (' + err.message + ')');
      });

  })
  .catch((err) => {
    handleError(err, 'Fetch objects failure (' + err.message + ')');
  });

function fetch() {
  return new Promise((resolve, reject) => {

    const results = {
      local: undefined,
      remote: undefined,
    }

    function local() {
      return new Promise((resolve, reject) => {

        console.log(colors.debug('Fetching local objects in ' + colors.bold(argv.source) + '...'));

        fastGlob('**', {
          cwd: argv.source,
          dot: true,
          ignore: argv.exclude,
        }).then((objects) => {

          const results = {};

          objects.forEach((object) => {
            results[object] = md5File.sync(argv.source + object);
          });

          resolve(results);

        });

      });
    }

    function remote() {
      return new Promise((resolve, reject) => {

        const params = {
          Bucket: argv.bucket,
          Prefix: argv.destination,
        };

        const results = {};

        const fetch = () => {

          s3.listObjectsV2(params, (err, data) => {

            if (err) {
              return reject(err);
            }

            data.Contents.forEach((content) => {
              results[content.Key.replace(argv.destination, '')] = content.ETag.replace(/"/g, '');
            });

            if (data.IsTruncated) {
              params.ContinuationToken = data.NextContinuationToken;
              return fetch();
            }

            resolve(results);

          });
        };

        console.log(colors.debug('Fetching remote objects in ' + colors.bold(params.Bucket + (params.Prefix ? '/' + params.Prefix : '')) + '...'));

        fetch();

      });
    }

    local()
      .then((fetched) => {
        results.local = fetched;
        if (results.remote) {
          resolve(results);
        }
      })
      .catch((err) => {
        reject(err);
      });

    remote()
      .then((fetched) => {
        results.remote = fetched;
        if (results.local) {
          resolve(results);
        }
      })
      .catch((err) => {
        reject(err);
      });

  });
}

function changes(fetched) {
  return new Promise((resolve, reject) => {

    const results = {
      added: [],
      modified: [],
      deleted: [],
    };

    console.log(colors.debug('Checking for modifications...'));

    Object.keys(fetched.local).forEach((key) => {
      if (!fetched.remote.hasOwnProperty(key)) {
        results.added.push(key);
        console.log(colors.green.bold('A ') + key);
      } else if (fetched.local[key] !== fetched.remote[key]) {
        results.modified.push(key);
        console.log(colors.yellow.bold('M ') + key);
      }
    });

    if (argv.delete) {
      Object.keys(fetched.remote).forEach((key) => {
        if (!fetched.local.hasOwnProperty(key)) {
          results.deleted.push(key);
          console.log(colors.red.bold('D ') + key);
        }
      });
    }

    resolve(results);

  });
}

function deploy(uploads, deletes) {
  return new Promise((resolve, reject) => {

    function uploadObjects() {
      return new Promise((resolve, reject) => {

        const uploaded = [];

        const defaults = {
          Bucket: argv.bucket,
          ACL: 'public-read',
        };

        try {

          if (!uploads.length) {
            resolve(uploaded);
          }

          uploads.forEach((key) => {

            const file = argv.source + key;
            const stats = fs.statSync(file);
            const stream = fs.createReadStream(file);

            stream.on('error', function(err) {
              throw err;
            });

            let params = Object.assign({
              Body: stream,
              Key: argv.destination + key,
              ContentType: mimeTypes.lookup(file) || 'application/octet-stream',
              ContentLength: stats.size,
            }, defaults);

            console.log(colors.info('Uploading ' + colors.bold(params.Key) + ' (' + prettyBytes(params.ContentLength)  + ') as ' + colors.bold(params.ContentType) + ' to ' + colors.bold(params.Bucket) + '...'));

            s3.upload(params, function(err, data) {
              if (err) {
                throw err;
              }
              uploaded.push(params.Key);
              if (uploaded.length === uploads.length) {
                resolve(uploaded);
              }
            });

          });

        } catch (error) {
          reject(error);
        }

      });
    }

    function deleteObjects() {
      return new Promise((resolve, reject) => {

        const deleted = [];

        const params = {
          Bucket: argv.bucket,
          Delete: {
            Objects: [],
          },
        };

        if (!deletes.length) {
          return resolve(deleted);
        }

        deletes.forEach((key) => {
          key = argv.destination + key;
          console.log(colors.warn('Deleting ' + colors.bold(key) + ' from ' + colors.bold(argv.bucket) + '...'));
          params.Delete.Objects.push({Key: key});
          deleted.push(key);
        });

        s3.deleteObjects(params, function(err, data) {
          err ? reject(err) : resolve(deleted);
        });

      });
    }

    uploadObjects()
      .then((uploaded) => {

        deleteObjects()
          .then((deleted) => {

            resolve({
              uploaded,
              deleted,
            });

          })
          .catch((err) => {
            reject(err);
          });

      })
      .catch((err) => {
        reject(err);
      });

  });
}

function invalidate(invalidations) {
  return new Promise((resolve, reject) => {

    const invalidated = [];
    let url;

    if (!argv.distribution) {
      resolve(invalidated);
    }

    invalidations.forEach((key) => {
      url = querystring.escape('/' + key).replace('%2F', '/');
      invalidated.push(url);
      console.log(colors.info('Invalidating ' + colors.bold(url) + ' on CloudFront distribution ' + colors.bold(argv.distribution) + '...'));
    });

    const params = {
      DistributionId: argv.distribution,
      InvalidationBatch: {
        CallerReference: Math.floor(Date.now() / 1000).toString(),
        Paths: {
          Quantity: invalidated.length,
          Items: invalidated,
        },
      },
    };

    cloudfront.createInvalidation(params, (err, data) => {
      err ? reject(err) : resolve(invalidated);
    });

  });
}

function handleError(err, message) {
  console.error(colors.red(colors.bold('ERROR ') + message || err.message));
  process.exit(1);
}
