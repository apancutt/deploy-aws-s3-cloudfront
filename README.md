# deploy-aws-s3-cloudfront

Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.

## Installation

    npm install --save deploy-aws-s3-cloudfront

### Authentication

This packages uses the [AWS SDK for Node.js](https://aws.amazon.com/sdk-for-node-js/) and defers authentication to the SDK.

If you are relying on credentials stored in `~/.aws/credentials` you can use `AWS_PROFILE=<profile> deploy-aws-s3-cloudfront ...` to use a custom-named profile.

## Usage

    deploy-aws-s3-cloudfront --bucket <bucket> [options]

### Options

#### `--acl <canned-acl>`

A canned ACL string. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property for accepted values.

#### `--bucket <name>` (required)

AWS S3 bucket name to deploy to.

#### `--delete`

Delete files from AWS S3 that do not exist locally.

#### `--destination <path>`

Path to remote directory to sync to.

#### `--distribution <ID>`

AWS CloudFront distribution ID to invalidate.

No invalidation is performed if this option is omitted.

#### `--exclude <pattern> [<pattern>...]`

Pattern(s) to exclude from deployment.

Refer to the [fast-glob](https://www.npmjs.com/package/fast-glob) documentation for supported patterns.

#### `--invalidation-path <path>`

Set the invalidation path (URL-encoded if necessary) instead of automatically detecting objects to invalidate.

This can be used to explicity set the invalidation path rather than have the paths generated from the changeset.

This option is typically used to reduce [invalidation costs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#PayingForInvalidation) by using a wildcard pattern (e.g. `--invalidation-path "/*"`).

#### `--cache-control-no-cache <path> [<path>...]`

Disable caching of specified S3 path(s). Paths ending with a `/` or `*` will be treated as wildcards.

For example, any of the following `<path>` values will disable caching of objects with the root `build` directory: `build/`, `build/*` or `build*`.

#### `--non-interactive`

Do not prompt for confirmation.

#### `--react`

Use recommended settings for `create-react-app`s and disable caching of `index.html`.

Default value `false`

#### `--source <path>`

Path to local directory to sync from.

Default value `.`

## Installation as a `run-script` alias (optional)

Add a `deploy` script alias to your `package.json` file:

    {
      ...
      "scripts": {
        ...
        "deploy": "deploy-aws-s3-cloudfront --bucket my-bucket"
      }
    }

Run `yarn run deploy` to deploy.

If you need to pass user or environment-level options that you don't want committed into `package.json` you can provide these at call-time, e.g. `yarn run deploy --distribution abc123`.

## Configuration for [create-react-app](https://github.com/facebook/create-react-app) projects

Pass the `--react` option when deploying apps created using `create-react-app`. This is shortcut for `deploy-aws-s3-cloudfront --source ./build/ --cache-control-no-cache index.html`.

## Alternatives (and why this package exists!)

* [AWS S3 Sync](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html) (bundled with [AWS CLI](https://aws.amazon.com/cli/))

  The `aws s3 sync` command uses the modification time to identify modified assets. This doesn't work well when building a project often involves regenerating files with fresh timestamps but identical content.

  This package will instead perform a checksum comparison to minimise the deployment payload. The MD5 checksum will be computed against local files then compared against the ETag of the corresponding remote objects.

* [react-deploy-s3](https://www.npmjs.com/package/react-deploy-s3)

  For React apps, the `react-deploy-s3` provides similar behaviour to this package. However, `react-deploy-s3` expects your AWS credentials to be passed in as command arguments and requires additional configuration to get set up. In contrast, this package defers authentication to the AWS SDK and therefore supports multiple authentication strategies (e.g. IAM roles, environment variables and profiles).

  Additionally, `react-deploy-s3` will purge everything from your S3 bucket before re-uploading the entire build directory. Here, however, deployments are incremental resulting in a smaller payload and minimal interruption. Likewise, this package will perform a more efficient CloudFront purge by executing an invalidation on the affected paths only, as opposed to a site-wide refresh as performed by `react-deploy-s3`.
