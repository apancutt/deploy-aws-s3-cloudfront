# deploy-aws-s3-cloudfront

Syncs a local directory to an AWS S3 bucket, optionally invalidating affected CloudFront paths.

## Installation

    npm install --save deploy-aws-s3-cloudfront

### Authentication

This packages uses the [AWS SDK for Node.js](https://aws.amazon.com/sdk-for-node-js/) and defers authentication to the SDK.

If you are relying on credentials stored in `~/.aws/credentials` you can use `AWS_PROFILE=<profile> deploy-aws-s3-cloudfront ...` to use a custom-named profile.

## Usage

    deploy-aws-s3-cloudfront --bucket <bucket> [options]
    deploy-aws-s3-cloudfront install-soft-delete --bucket <bucket> [options]

### Options

#### Options: Global

##### `--bucket <name>` (required)

AWS S3 bucket name to deploy to.

Default: `undefined`

##### `--debug`

Enable output of debugging log messages.

Default: `false`

##### `--non-interactive`

Do not prompt for confirmations.

Default: `false`

##### `--output-format <format>`

Logging output format.

Accepted formats are: `colorized`, `json` or `text`.

Default: `text`

#### Options: `deploy-aws-s3-cloudfront`

##### `--acl <pattern:value> [<pattern:value>...]`

Apply ACL to specific pattern(s). The first pattern to match the path is applied.

See the [Using Patterns](#using-patterns) section for pattern usage.

See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property for accepted values.

Default: `[]`

##### `--cache-control <pattern>:<value> [<pattern>:<value>...]`

Apply Cache Control to specific pattern(s). The first pattern to match the path is applied.

See the [Using Patterns](#using-patterns) section for pattern usage.

Default: `[]`

##### `--delete`

Delete objects in AWS S3 that do not exist locally. Objects are retained if both this option and [`--soft-delete`](#--soft-delete) are omitted.

Default: `false`

##### `--destination <path>`

Path to remote directory to sync to.

Default: `/`

##### `--distribution <ID>`

AWS CloudFront distribution ID to invalidate. No invalidation is performed if this option is omitted.

Default: `undefined`

##### `--exclude <pattern> [<pattern>...]`

Pattern(s) to exclude from deployment.

See the [Using Patterns](#using-patterns) section for pattern usage.

Default: `[]`

##### `--invalidation-path <path> [<path>...]`

Set the invalidation path(s) instead of automatically detecting objects to invalidate. Paths should be absolute (with a leading slash).

This option is typically used to reduce [invalidation costs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#PayingForInvalidation) by using a wildcard pattern (e.g. `--invalidation-path "/*"`).

Special characters should be URL-encoded where necessary.

Default: `[]`

##### `--react`

Use recommended settings for React applications.

See the [React Apps](#react-apps) section for more information.

Default: `false`

##### `--retain <pattern> [<pattern>...]`

Pattern(s) to skip from deletion. Used with the [`--delete`](#--delete) option.

See the [Using Patterns](#using-patterns) section for pattern usage.

Default: `[]`

##### `--soft-delete`

Tag objects in AWS S3 that do not exist locally. Objects are retained if both this option and [`--delete`](#--delete) are omitted.

See the [Soft-Deleting Objects](#soft-deleting-objects) section for more information.

Default: `false`

##### `--soft-delete-tag-key <key>`

Soft-deleted objects are tagged with this key.

See the [Soft-Deleting Objects](#soft-deleting-objects) section for more information.

Default: `deleted`

##### `--soft-delete-tag-value <value>`

Soft-deleted objects are tagged with this value.

See the [Soft-Deleting Objects](#soft-deleting-objects) section for more information.

Default: `true`

##### `--source <path>`

Path to local directory to sync from.

Default: `.`

##### `--tags <pattern>:<key>=<value>[,<key>=<value>...] [<pattern>:<key>=<value>[,<key>=<value>...]...]`

Apply tags to specific pattern(s). All patterns that match the path are applied.

See the [Using Patterns](#using-patterns) section for pattern usage.

Default: `[]`

#### Options: `deploy-aws-s3-cloudfront install-soft-delete`

##### `--expiration <expiration>`

Expiration (in days) rule for generated soft-deletion lifecycle policy.

Default: `90`

##### `--id <ID>`

ID for generated soft-deletion lifecycle policy.

Default: `Soft-Delete`

##### `--tag-key <key>`

Key used for generated soft-deletion lifecycle policy tag.

Default: `deleted`

##### `--tag-value <value>`

Value used for generated soft-deletion lifecycle policy tag.

Default: `true`

## Installation as a `run-script` alias (optional)

Add script aliases to your `package.json` file:

```
{
  ...
  "scripts": {
    ...
    "predeploy": "deploy-aws-s3-cloudfront install-soft-delete --bucket my-bucket",
    "deploy": "deploy-aws-s3-cloudfront --bucket my-bucket"
  }
}
```

Run `yarn run deploy` or `npm run deploy` to deploy. A soft-delete lifecycle rule will also be installed. Remove the `predeploy` script if you do not use the soft-deletion feature or prefer to install it manually.

If you need to pass user or environment-level options that you don't want committed into `package.json` you can provide these at call-time, e.g. `yarn run deploy --distribution abc123` or `npm run deploy -- --distribution abc123`.

## Using Patterns

Several options support patterns which allows the option to apply only to matching objects.

Patterns should be relative (without a leading slash) to the source directory and are parsed using [micromatch](https://www.npmjs.com/package/micromatch).

## Soft-Deleting Objects

Objects can be soft-deleted using an [S3 Object Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/dev/object-lifecycle-mgmt.html) expiration rule.

This feature can be enabled using the `--soft-delete` option. When enabled, objects are not deleted from S3 but are instead tagged for later removal by a lifecycle rule. The lifecycle rule is created using the `install-soft-delete` command.

The installed rule will automatically delete objects that are both tagged for deletion and have expired. The expiration time is relative to the object creation date, in days.

In some cases, soft-deleted items may be deleted immediately after being tagged for deletion. This happens when the object was created earlier than the expiration period. The expiration period should therefore be set to a suitable duration according to your release schedule using the `--expiration` option (default is 90 days). It is not currently possible to expire objects based on the tag creation date, only the object creation date. This is a limitation of AWS S3.

### Examples

```
Created                  Tagged     Deleted
   |-----------|-----------|-----------|-----------> Days
   0           30          60          90
```

In this example, the expiration is set to 90 days and the object was tagged for soft-deletion 60 days after creation. It will be deleted 30 days later.

```
                                            Tagged+
Created                                     Deleted
   |-----------|-----------|-----------|-------|---> Days
   0           30          60          90     110
```

In this example, the expiration is set to 90 days and the object was tagged for soft-deletion 110 days after creation. It will be deleted immediately.

## React Apps

Use the `--react` option when deploying apps created using `create-react-app`. This is shortcut for `deploy-aws-s3-cloudfront --source ./build/ --cache-control index.html:no-cache`.

If you opt to delete objects on deployment, it is recommended to use the `--soft-delete` option to minimise impact to users online during a deployment. Such users will have loaded the previous version of `index.html` which will likely reference assets which have since been deleted by a deployment. They will not receive the latest `index.html` until they refresh. Using the `--soft-delete` option will retain stale objects in S3 for a period of time to allow online users to continue browsing until they refresh to get the latest version.

## Example IAM Policy

The example below should allow you to use the core functionality of this tool. Advanced usage (such as soft-deletion) may require further permissions (TODO).
  
Please replace `<BUCKET_NAME>`, `<ACCOUNT_ID>`, `<DISTRIBUTION_ID>` values with those of your own.
  
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListBuckets",
            "Effect": "Allow",
            "Action": "s3:ListAllMyBuckets",
            "Resource": "*"
        },
        {
            "Sid": "ListBucket",
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::<BUCKET_NAME>"
        },
        {
            "Sid": "OperateWithObjects",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:PutObjectVersionAcl",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion"
            ],
            "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
        },
        {
            "Sid": "CloudFrontInvalidation",
            "Effect": "Allow",
            "Action": "cloudfront:CreateInvalidation",
            "Resource": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
    ]
}
```

## Alternatives

* [AWS S3 Sync](https://docs.aws.amazon.com/cli/latest/reference/s3/sync.html) (bundled with [AWS CLI](https://aws.amazon.com/cli/))

  The `aws s3 sync` command uses the modification time to identify modified assets. This doesn't work well when building a project often involves regenerating files with fresh timestamps but identical content.

  This package will instead perform a checksum comparison to minimise the deployment payload. The MD5 checksum will be computed against local files then compared against the ETag of the corresponding remote objects.

* [react-deploy-s3](https://www.npmjs.com/package/react-deploy-s3)

  For React apps, the `react-deploy-s3` provides similar behaviour to this package. However, `react-deploy-s3` expects your AWS credentials to be passed in as command arguments and requires additional configuration to get set up. In contrast, this package defers authentication to the AWS SDK and therefore supports multiple authentication strategies (e.g. IAM roles, environment variables and profiles).

  Additionally, `react-deploy-s3` will purge everything from your S3 bucket before re-uploading the entire build directory. Here, however, deployments are incremental resulting in a smaller payload and minimal interruption. Likewise, this package will perform a more efficient CloudFront purge by executing an invalidation on the affected paths only, as opposed to a site-wide refresh as performed by `react-deploy-s3`.
