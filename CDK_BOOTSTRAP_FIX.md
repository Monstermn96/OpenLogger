# Fix for CDK Bootstrap Permission Error

## Problem
The Amplify build is failing with:
```
AccessDeniedException: User: arn:aws:sts::630658076165:assumed-role/AmplifySSRLoggingRole-12f67e55-d803-4a4d-aaaa-aed4fbb236b8/BuildSession is not authorized to perform: ssm:GetParameter on resource: arn:aws:ssm:us-east-1:630658076165:parameter/cdk-bootstrap/hnb659fds/version
```

## Solution Options

### Option 1: Update IAM Permissions (Recommended)

1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/
2. Search for the role: `AmplifySSRLoggingRole-12f67e55-d803-4a4d-aaaa-aed4fbb236b8`
3. Click on the role name
4. Click "Add permissions" → "Create inline policy"
5. Use the JSON editor and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParameterHistory",
                "ssm:DescribeParameters"
            ],
            "Resource": [
                "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*"
            ]
        }
    ]
}
```

6. Name the policy: `CDKBootstrapSSMReadAccess`
7. Save the policy

### Option 2: Bootstrap CDK in Your Account

Run this command in your AWS CLI:
```bash
npx aws-cdk bootstrap aws://630658076165/us-east-1
```

### Option 3: Use Amplify's Service Role

1. Go to your Amplify App in AWS Console
2. Navigate to "App settings" → "General"
3. Under "Service role", click "Create new role" or update existing
4. Ensure the role has the necessary SSM permissions

### Option 4: Temporary Workaround (Not Recommended for Production)

Add to your amplify.yml:
```yaml
backend:
  phases:
    preBuild:
      commands:
        - export CDK_NEW_BOOTSTRAP=1
```

## After Fixing

1. Trigger a new build in Amplify Console
2. Monitor the build logs to ensure it passes the bootstrap check
3. If issues persist, check that your AWS account has been properly bootstrapped

## Additional Notes

- The npm warnings in your logs (deprecated packages) are not causing the build failure
- The peer dependency warnings are also not critical
- The actual failure is purely the IAM permission issue
