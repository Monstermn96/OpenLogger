# CDK Asset Publishing Troubleshooting

## Current Issue
CDK is failing to publish assets with "current_account-current_region" in the identifier, indicating it can't resolve the AWS environment.

## Solutions to Try (in order)

### 1. ✅ Current Attempt - Inline Environment Variables
We've updated amplify.yml to pass environment variables directly:
```yaml
CDK_DEFAULT_ACCOUNT=630658076165 CDK_DEFAULT_REGION=us-east-1 npx ampx pipeline-deploy ...
```

### 2. If Still Failing - Add AWS SDK Environment Detection
Update amplify.yml to:
```yaml
build:
  commands:
    - npm install
    - echo "AWS Account: $(aws sts get-caller-identity --query Account --output text)"
    - echo "AWS Region: $AWS_DEFAULT_REGION"
    - AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    - CDK_DEFAULT_ACCOUNT=$AWS_ACCOUNT_ID CDK_DEFAULT_REGION=$AWS_DEFAULT_REGION npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID --outputs-out-dir .
```

### 3. Alternative - Use Amplify's Built-in Environment
```yaml
build:
  commands:
    - npm install
    - npx ampx configure
    - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID --outputs-out-dir . --debug
```

### 4. Nuclear Option - Bypass CDK Environment Check
Add to your backend.ts:
```typescript
import { Stack } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage
});

// Force environment
const stack = backend.createStack('amplify-meta-config');
stack.node.setContext('@aws-cdk/core:bootstrapQualifier', 'hnb659fds');
```

### 5. Additional IAM Permissions Needed
Add to the Amplify role:
```json
{
    "Effect": "Allow",
    "Action": [
        "sts:GetCallerIdentity",
        "sts:AssumeRole"
    ],
    "Resource": "*"
}
```

## Debug Information to Collect
If the build continues to fail, check for:
1. The exact asset name that's failing
2. Whether ALL assets fail or just specific ones
3. Any additional error details in the logs

## Quick Verification
After the current build completes, check:
1. Does it still show "current_account-current_region"?
2. Are there any new error messages?
3. Does it progress further than before?
