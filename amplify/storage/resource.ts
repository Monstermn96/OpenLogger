import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'openLoggerStorage',
  access: (allow) => ({
    'logs/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'ecu-profiles/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'exports/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
