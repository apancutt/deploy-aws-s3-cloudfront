# deploy-aws-s3-cloudfront

Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.

## Authentication

This packages uses the [AWS SDK for Node.js](https://aws.amazon.com/sdk-for-node-js/) and defers authentication to the SDK.

If you are relying on credentials stored in `~/.aws/credentials` you can use the `--profile` option to specify a named profile, if required.

## Installation

    npm install --save deploy-aws-s3-cloudfront

## Usage

    deploy-aws-s3-cloudfront [options]
    
    Syncs a local directory to an AWS S3 bucket, optionally invalidating affected
    CloudFront paths.
    
    Options:
      --help               Show help                                       [boolean]
      --version            Show version number                             [boolean]
      --bucket             AWS S3 bucket name to deploy to       [string] [required]
      --distribution       AWS CloudFront distribution ID to invalidate     [string]
      --source             Path to local directory to sync from
                                                  [string] [required] [default: "."]
      --destination        Path to remote directory to sync to
                                                  [string] [required] [default: "/"]
      --exclude            Patterns to exclude from deployment [array] [default: []]
      --delete             Delete files from AWS S3 that do not exist locally
                                                          [boolean] [default: false]
      --invalidation-path  Set the invalidation path instead of automatically
                           detecting objects to invalidate                  [string]
      --profile            AWS profile to use as named in ~/.aws/credentials[string]
      --non-interactive    Do not prompt for confirmation [boolean] [default: false]

### Installing a `run-script` alias (optional)

Add a `deploy` script alias to your `package.json` file:

    {
      ...
      "scripts": {
        ...
        "deploy": "deploy-aws-s3-cloudfront [options]"
      }
    }

Run `npm run build` to build then `npm run deploy` to deploy.

If you need to pass user-level options that you don't wan't committed into `package.json`, the you can provide these options at call-time, e.g. `npm run deploy -- --profile <profile>`.

### Configuring for React apps built with `create-react-app`

Set the `--source` option to `/.build/`:

    {
      ...
      "scripts": {
        ...
        "deploy": "deploy-aws-s3-cloudfront --source=./build/ [options]"
      }
    }

Then simply run `npm run build` then `npm run deploy` to deploy latest build.

If you prefer to always run a build before deployment:

    {
      ...
      "scripts": {
        ...
        "deploy": "npm run build && deploy-aws-s3-cloudfront --source=./build/ [options]"
      }
    }

### Alternatives (and why this package exists!)

* [AWS S3 Sync](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html) (bundled with [AWS CLI](https://aws.amazon.com/cli/))

  The `aws s3 sync` command uses the modification time to identify modified assets. This doesn't work well when building a project often involves regenerating files with fresh timestamps but identical content.

  This package will instead perform a checksum comparison to minimise the deployment payload. The MD5 checksum will be computed against all files then compared against the ETag of the corresponding remote objects.

* [react-deploy-s3](https://www.npmjs.com/package/react-deploy-s3) (NPM package)

  For React apps, the `react-deploy-s3` provides similar behaviour to this package. However, `react-deploy-s3` expects your AWS credentials to be passed in as command arguments and requires additional configuration to get set up. In contrast, this package defers authentication to the AWS SDK and therefore supports multiple authentication strategies (e.g. IAM roles, environment variables and profiles).

  Additionally, `react-deploy-s3` will purge everything from your S3 bucket before re-uploading the entire build directory. Here, however, deployments are incremental resulting in a smaller payload and minimal interruption. Likewise, this package will perform a more efficient CloudFront purge by executing an invalidation on the affected paths only, as opposed to a site-wide refresh as performed by `react-deploy-s3`.
