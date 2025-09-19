import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a data model for OBD2 logging
=========================================================================*/

const schema = a.schema({
  Vehicle: a
    .model({
      vin: a.string(),
      make: a.string().required(),
      model: a.string().required(),
      year: a.integer().required(),
      nickname: a.string(),
      owner: a.string(),
      sessions: a.hasMany('LogSession', 'vehicleId'),
    })
    .authorization((allow) => [allow.owner()]),

  LogSession: a
    .model({
      vehicleId: a.id().required(),
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      parameters: a.string().array(), // List of parameters being logged
      logs: a.hasMany('DataLog', 'sessionId'),
      notes: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  DataLog: a
    .model({
      sessionId: a.id().required(),
      session: a.belongsTo('LogSession', 'sessionId'),
      timestamp: a.datetime().required(),
      data: a.json().required(), // JSON object with all parameter values
      // Example data format:
      // {
      //   "rpm": 3500,
      //   "speed": 65,
      //   "intakeTemp": 45,
      //   "boostPressure": 15.5,
      //   "timing": 12,
      //   "coolantTemp": 85,
      //   "throttlePosition": 45.2
      // }
    })
    .authorization((allow) => [allow.owner()]),

  ECUProfile: a
    .model({
      name: a.string().required(),
      vehicleId: a.id().required(),
      vehicle: a.belongsTo('Vehicle', 'vehicleId'),
      profileData: a.json().required(), // ECU configuration data
      createdAt: a.datetime().required(),
      description: a.string(),
      isActive: a.boolean().default(false),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
