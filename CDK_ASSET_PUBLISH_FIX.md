# Fix for CDK Asset Publishing Error

## Current Error
```
[CDKAssetPublishError] CDK failed to publish assets
∟ Caused by: [ToolkitError] Failed to publish asset AmplifyBranchLinker/CustomResourceProvider/framework-onEvent/Code (current_account-current_region-aca8d54f)
```

## Root Cause
The CDK environment hasn't been bootstrapped in your AWS account/region. The "current_account-current_region" in the error indicates CDK can't resolve the actual account and region values.

## Solution: Bootstrap CDK

### Option 1: Using AWS CLI (Recommended)

1. Open a terminal with AWS CLI configured
2. Run the bootstrap command:
```bash
npx aws-cdk bootstrap aws://630658076165/us-east-1
```

3. Wait for the bootstrap process to complete (it will create necessary S3 buckets and roles)

### Option 2: Using Amplify Build Commands

Update your `amplify.yml` to include CDK bootstrap:

```yaml
version: 1
applications:
  - appRoot: .
    backend:
      phases:
        preBuild:
          commands:
            - echo "Checking CDK Bootstrap..."
            - export AWS_REGION=us-east-1
            - export CDK_DEFAULT_ACCOUNT=630658076165
            - export CDK_DEFAULT_REGION=us-east-1
            - npx aws-cdk bootstrap aws://630658076165/us-east-1 || echo "Bootstrap may already exist"
        build:
          commands:
            - npm install
            - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID --outputs-out-dir .
```

### Option 3: Update IAM Permissions

The Amplify build role needs additional permissions for CDK asset publishing:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:GetBucketLocation",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::cdk-*-assets-630658076165-us-east-1",
                "arn:aws:s3:::cdk-*-assets-630658076165-us-east-1/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:DescribeStacks",
                "cloudformation:CreateChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:DeleteChangeSet",
                "cloudformation:DescribeChangeSet"
            ],
            "Resource": [
                "arn:aws:cloudformation:us-east-1:630658076165:stack/CDKToolkit/*"
            ]
        }
    ]
}
```

## Quick Test

After bootstrapping, you can verify it worked by checking if the CDK bootstrap stack exists:

1. Go to AWS CloudFormation Console
2. Look for a stack named "CDKToolkit"
3. If it exists, bootstrap was successful

## Next Steps

1. Bootstrap CDK using one of the methods above
2. Add the additional IAM permissions if needed
3. Trigger a new build in Amplify Console
