import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Stack } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage
});

// Explicitly set CDK environment for Amplify deployments
const stack = Stack.of(backend.auth.resources.userPool);
if (!stack.account || stack.account === 'current_account') {
  // Force CDK to use specific account/region during Amplify builds
  process.env.CDK_DEFAULT_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT || '630658076165';
  process.env.CDK_DEFAULT_REGION = process.env.CDK_DEFAULT_REGION || 'us-east-1';
}
