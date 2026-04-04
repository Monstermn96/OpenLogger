import type { OBD2Parameter } from '../types/obd2.types';

export const OBD2_PARAMETERS: Record<string, OBD2Parameter> = {
  // Standard OBD2 PIDs (Mode 01)
  '0104': {
    pid: '0104',
    name: 'Engine Load',
    description: 'Calculated engine load',
    unit: '%',
    min: 0,
    max: 100,
    formula: (data) => (data[0] * 100) / 255,
  },
  '0105': {
    pid: '0105',
    name: 'Coolant Temperature',
    description: 'Engine coolant temperature',
    unit: '°C',
    min: -40,
    max: 215,
    formula: (data) => data[0] - 40,
  },
  '010C': {
    pid: '010C',
    name: 'Engine RPM',
    description: 'Engine speed',
    unit: 'rpm',
    min: 0,
    max: 16383.75,
    formula: (data) => ((data[0] * 256) + data[1]) / 4,
  },
  '010D': {
    pid: '010D',
    name: 'Vehicle Speed',
    description: 'Vehicle speed',
    unit: 'km/h',
    min: 0,
    max: 255,
    formula: (data) => data[0],
  },
  '010E': {
    pid: '010E',
    name: 'Timing Advance',
    description: 'Timing advance',
    unit: '° before TDC',
    min: -64,
    max: 63.5,
    formula: (data) => (data[0] / 2) - 64,
  },
  '010F': {
    pid: '010F',
    name: 'Intake Air Temperature',
    description: 'Intake air temperature',
    unit: '°C',
    min: -40,
    max: 215,
    formula: (data) => data[0] - 40,
  },
  '0110': {
    pid: '0110',
    name: 'MAF Air Flow Rate',
    description: 'Mass air flow sensor',
    unit: 'g/s',
    min: 0,
    max: 655.35,
    formula: (data) => ((data[0] * 256) + data[1]) / 100,
  },
  '0111': {
    pid: '0111',
    name: 'Throttle Position',
    description: 'Throttle position',
    unit: '%',
    min: 0,
    max: 100,
    formula: (data) => (data[0] * 100) / 255,
  },
  '011F': {
    pid: '011F',
    name: 'Run Time',
    description: 'Run time since engine start',
    unit: 'seconds',
    min: 0,
    max: 65535,
    formula: (data) => (data[0] * 256) + data[1],
  },
  '0133': {
    pid: '0133',
    name: 'Barometric Pressure',
    description: 'Absolute barometric pressure',
    unit: 'kPa',
    min: 0,
    max: 255,
    formula: (data) => data[0],
  },
  '015C': {
    pid: '015C',
    name: 'Engine Oil Temperature',
    description: 'Engine oil temperature',
    unit: '°C',
    min: -40,
    max: 210,
    formula: (data) => data[0] - 40,
  },

  // Common enhanced PIDs for turbocharged engines (VW Golf R specific)
  '0170': {
    pid: '0170',
    name: 'Boost Pressure (Actual)',
    description: 'Actual boost pressure from turbocharger',
    unit: 'PSI',
    min: -14.7,
    max: 30,
    formula: (data) => {
      // Convert from mbar to PSI
      const mbar = (data[0] * 256 + data[1]) / 10;
      return (mbar - 1000) * 0.0145038; // Convert to PSI gauge pressure
    },
  },
  '0171': {
    pid: '0171',
    name: 'Boost Pressure (Requested)',
    description: 'Requested boost pressure',
    unit: 'PSI',
    min: -14.7,
    max: 30,
    formula: (data) => {
      const mbar = (data[0] * 256 + data[1]) / 10;
      return (mbar - 1000) * 0.0145038;
    },
  },
  
  // Fuel system PIDs
  '012F': {
    pid: '012F',
    name: 'Fuel Tank Level',
    description: 'Fuel tank level input',
    unit: '%',
    min: 0,
    max: 100,
    formula: (data) => (data[0] * 100) / 255,
  },
  '0123': {
    pid: '0123',
    name: 'Fuel Rail Pressure',
    description: 'Fuel rail pressure (gauge)',
    unit: 'kPa',
    min: 0,
    max: 5177.265,
    formula: (data) => ((data[0] * 256) + data[1]) * 0.079,
  },
  
  // Additional performance parameters
  '015E': {
    pid: '015E',
    name: 'Engine Fuel Rate',
    description: 'Engine fuel rate',
    unit: 'L/h',
    min: 0,
    max: 3276.75,
    formula: (data) => ((data[0] * 256) + data[1]) / 20,
  },
  '0166': {
    pid: '0166',
    name: 'Mass Air Flow Sensor Bank 1',
    description: 'MAF sensor reading bank 1',
    unit: 'g/s',
    min: 0,
    max: 2047.96875,
    formula: (data) => ((data[0] * 256) + data[1]) / 32,
  },
};

// VW Group specific parameters (may require special access)
export const VW_SPECIFIC_PARAMETERS: Record<string, OBD2Parameter> = {
  '22F446': {
    pid: '22F446',
    name: 'Turbo RPM',
    description: 'Turbocharger speed',
    unit: 'rpm',
    min: 0,
    max: 250000,
    formula: (data) => (data[2] * 256 + data[3]) * 10,
  },
  '22F40D': {
    pid: '22F40D',
    name: 'Intake Manifold Pressure',
    description: 'Intake manifold absolute pressure',
    unit: 'mbar',
    min: 0,
    max: 2550,
    formula: (data) => (data[2] * 256 + data[3]) / 10,
  },
  '22F433': {
    pid: '22F433',
    name: 'EGT Bank 1',
    description: 'Exhaust gas temperature bank 1',
    unit: '°C',
    min: -40,
    max: 1000,
    formula: (data) => ((data[2] * 256 + data[3]) / 10) - 40,
  },
  '22F477': {
    pid: '22F477',
    name: 'Turbo Wastegate Position',
    description: 'Turbo wastegate duty cycle',
    unit: '%',
    min: 0,
    max: 100,
    formula: (data) => (data[2] * 100) / 255,
  },
};

// Combine all parameters
export const ALL_PARAMETERS = {
  ...OBD2_PARAMETERS,
  ...VW_SPECIFIC_PARAMETERS,
};

// Commonly logged parameters for performance monitoring
export const DEFAULT_LOGGING_PARAMETERS = [
  '010C', // RPM
  '010D', // Speed
  '0105', // Coolant Temp
  '010F', // Intake Temp
  '0111', // Throttle Position
  '0170', // Boost Pressure (Actual)
  '010E', // Timing Advance
  '0110', // MAF
];

// Parameter categories for UI organization
export const PARAMETER_CATEGORIES = {
  ENGINE: ['0104', '010C', '011F', '010E'],
  TEMPERATURE: ['0105', '010F', '015C', '22F433'],
  FUEL: ['012F', '0123', '015E'],
  AIR_INTAKE: ['0110', '0111', '0166', '22F40D'],
  BOOST: ['0170', '0171', '22F446', '22F477'],
  SPEED_POSITION: ['010D', '0133'],
};
