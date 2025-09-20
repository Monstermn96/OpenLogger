# Amplify Environment Variables Setup

## How to Add Environment Variables in Amplify Console

1. Go to your Amplify App in AWS Console
2. Navigate to "App settings" → "Environment variables"
3. Click "Manage variables"
4. Add the following variables:

## Recommended Environment Variables

### CDK Related
```
CDK_DEFAULT_ACCOUNT=630658076165
CDK_DEFAULT_REGION=us-east-1
AWS_REGION=us-east-1
```

### Amplify Build Optimization
```
AMPLIFY_SKIP_BACKEND_BUILD=false
AMPLIFY_ENABLE_CONCURRENT_DEPLOYMENT=true
```

### CDK Bootstrap (if needed)
```
CDK_NEW_BOOTSTRAP=1
```

### Node.js Memory (for large builds)
```
NODE_OPTIONS=--max-old-space-size=4096
```

## Steps to Add:

1. In Amplify Console, go to "App settings" → "Environment variables"
2. Click "Manage variables"
3. For each variable:
   - Enter the variable name
   - Enter the value
   - Click "Save"
4. Trigger a new build

## Additional Notes

- The `!Failed to set up process.env.secrets` warning in your logs suggests Amplify might be looking for SSM parameters
- If you have any secrets or API keys, add them as environment variables here rather than in code
- Environment variables are branch-specific, so you can have different values for different branches
