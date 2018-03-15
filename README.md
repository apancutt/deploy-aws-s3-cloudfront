# deploy-aws-s3-cloudfront

Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.

## Installation

    npm install --save deploy-aws-s3-cloudfront

### Authentication

This packages uses the [AWS SDK for Node.js](https://aws.amazon.com/sdk-for-node-js/) and defers authentication to the SDK.

If you are relying on credentials stored in `~/.aws/credentials` you can use the `--profile` option to specify a named profile, if required.

## Usage

    deploy-aws-s3-cloudfront --bucket <bucket> [options]

### Options

#### `--bucket <name>`

The name of the S3 bucket to sync to.

#### `--distribution <ID>`

The CloudFront distribution ID to invalidate after successful deployment.

If omitted, no invalidation will be performed.

#### `--exclude <pattern> [--exclude <pattern>...]`

Exclude local paths from being synced to the bucket. Refer to the [fast-glob](https://www.npmjs.com/package/fast-glob) documentation for supported patterns.

Multiple paths can be specified by passing multiple `--exclude` options.

#### `--delete`

If used, objects that do not exist locally will be deleted from the bucket.

#### `--invalidation-path <path>`

When used with the `--distribution` option, this can be used to set the invalidation path. If omitted, only the added, modified and deleted objects (if `--delete` option is used) are invalidated.

This option is typically used to reduce [invalidation costs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#PayingForInvalidation) by using a wildcard pattern (e.g. `--invalidation-path "/*"`).

#### `--profile <name>`

If depending on a named profile in `~/.aws/credentials` for authentication, use this option to provide the profile name.

#### `--non-interactive`

Never prompt for confirmation.

## Installation as a `run-script` alias (optional)

Add a `deploy` script alias to your `package.json` file:

    {
      ...
      "scripts": {
        ...
        "deploy": "deploy-aws-s3-cloudfront --bucket my-bucket"
      }
    }

Run `npm run build` to build then `npm run deploy` to deploy.

If you need to pass user-level options that you don't want committed into `package.json`, the you can provide these options at call-time, e.g. `npm run deploy -- --profile <profile>`.

## Configuration for `create-react-app` projects

Set the `--source` option to `/.build/`:

    {
      ...
      "scripts": {
        ...
        "deploy": "deploy-aws-s3-cloudfront --bucket my-bucket --source=./build/"
      }
    }

Then simply run `npm run build` then `npm run deploy` to deploy the latest build output.

If you prefer to always run a build before deployment:

    {
      ...
      "scripts": {
        ...
        "deploy": "npm run build && deploy-aws-s3-cloudfront --bucket my-bucket --source=./build/"
      }
    }

## Alternatives (and why this package exists!)

* [AWS S3 Sync](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html) (bundled with [AWS CLI](https://aws.amazon.com/cli/))

  The `aws s3 sync` command uses the modification time to identify modified assets. This doesn't work well when building a project often involves regenerating files with fresh timestamps but identical content.

  This package will instead perform a checksum comparison to minimise the deployment payload. The MD5 checksum will be computed against local files then compared against the ETag of the corresponding remote objects.

* [react-deploy-s3](https://www.npmjs.com/package/react-deploy-s3) (NPM package)

  For React apps, the `react-deploy-s3` provides similar behaviour to this package. However, `react-deploy-s3` expects your AWS credentials to be passed in as command arguments and requires additional configuration to get set up. In contrast, this package defers authentication to the AWS SDK and therefore supports multiple authentication strategies (e.g. IAM roles, environment variables and profiles).

  Additionally, `react-deploy-s3` will purge everything from your S3 bucket before re-uploading the entire build directory. Here, however, deployments are incremental resulting in a smaller payload and minimal interruption. Likewise, this package will perform a more efficient CloudFront purge by executing an invalidation on the affected paths only, as opposed to a site-wide refresh as performed by `react-deploy-s3`.
