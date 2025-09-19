export interface OBD2Parameter {
  pid: string;
  name: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  formula: (data: number[]) => number;
}

export interface OBD2Reading {
  parameter: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface VehicleData {
  rpm?: number;
  speed?: number;
  coolantTemp?: number;
  intakeTemp?: number;
  throttlePosition?: number;
  engineLoad?: number;
  fuelPressure?: number;
  manifoldPressure?: number;
  timingAdvance?: number;
  maf?: number; // Mass Air Flow
  o2Voltage?: number;
  fuelLevel?: number;
  barometricPressure?: number;
  catalystTemp?: number;
  ambientTemp?: number;
  engineOilTemp?: number;
  fuelRailPressure?: number;
  // VW specific
  boostPressure?: number;
  turboRpm?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  device?: BluetoothDevice;
  error?: string;
}

export interface LogSession {
  id: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  parameters: string[];
  data: OBD2Reading[];
}
