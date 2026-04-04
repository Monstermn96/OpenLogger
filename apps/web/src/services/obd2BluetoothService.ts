import { ALL_PARAMETERS } from '../constants/obd2Parameters';
import type { ConnectionStatus, OBD2Reading, VehicleData } from '../types/obd2.types';

export class OBD2BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // Standard Bluetooth UUIDs for Serial Port Profile
  private readonly SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '00002a00-0000-1000-8000-00805f9b34fb';

  async connect(): Promise<ConnectionStatus> {
    try {
      // Request Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SPP_SERVICE_UUID] },
          { namePrefix: 'OBD' },
          { namePrefix: 'ELM327' },
          { namePrefix: 'OBDII' },
        ],
        optionalServices: [this.SPP_SERVICE_UUID]
      });

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();
      
      // Get service
      const service = await this.server.getPrimaryService(this.SPP_SERVICE_UUID);
      
      // Get characteristic
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
      
      // Initialize OBD2 adapter
      await this.initializeOBD2();
      
      return {
        isConnected: true,
        device: this.device
      };
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  private async initializeOBD2(): Promise<void> {
    // Reset the OBD2 adapter
    await this.sendCommand('ATZ'); // Reset
    await this.delay(1000);
    
    // Configure the adapter
    await this.sendCommand('ATE0'); // Echo off
    await this.sendCommand('ATL0'); // Linefeeds off
    await this.sendCommand('ATS0'); // Spaces off
    await this.sendCommand('ATH0'); // Headers off
    await this.sendCommand('ATSP0'); // Auto protocol
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.characteristic) {
      throw new Error('Not connected to OBD2 device');
    }

    // Convert command to bytes and add carriage return
    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    
    // Send command
    await this.characteristic.writeValue(data);
    
    // Wait for response
    await this.delay(100);
    
    // Read response
    const response = await this.characteristic.readValue();
    const decoder = new TextDecoder();
    return decoder.decode(response).trim();
  }

  async readParameter(pid: string): Promise<OBD2Reading | null> {
    try {
      const parameter = ALL_PARAMETERS[pid];
      if (!parameter) {
        throw new Error(`Unknown PID: ${pid}`);
      }

      // Send OBD2 command
      const response = await this.sendCommand(pid);
      
      // Parse response
      const data = this.parseOBD2Response(response);
      if (!data) {
        return null;
      }

      // Calculate value using parameter formula
      const value = parameter.formula(data);
      
      return {
        parameter: parameter.name,
        value,
        unit: parameter.unit,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error reading parameter ${pid}:`, error);
      return null;
    }
  }

  async readMultipleParameters(pids: string[]): Promise<VehicleData> {
    const vehicleData: VehicleData = {};
    
    for (const pid of pids) {
      const reading = await this.readParameter(pid);
      if (reading) {
        // Map readings to VehicleData properties
        switch (pid) {
          case '010C':
            vehicleData.rpm = reading.value;
            break;
          case '010D':
            vehicleData.speed = reading.value;
            break;
          case '0105':
            vehicleData.coolantTemp = reading.value;
            break;
          case '010F':
            vehicleData.intakeTemp = reading.value;
            break;
          case '0111':
            vehicleData.throttlePosition = reading.value;
            break;
          case '0104':
            vehicleData.engineLoad = reading.value;
            break;
          case '010E':
            vehicleData.timingAdvance = reading.value;
            break;
          case '0110':
            vehicleData.maf = reading.value;
            break;
          case '0170':
            vehicleData.boostPressure = reading.value;
            break;
          case '015C':
            vehicleData.engineOilTemp = reading.value;
            break;
          case '0123':
            vehicleData.fuelRailPressure = reading.value;
            break;
          case '012F':
            vehicleData.fuelLevel = reading.value;
            break;
          case '0133':
            vehicleData.barometricPressure = reading.value;
            break;
          case '22F446':
            vehicleData.turboRpm = reading.value;
            break;
        }
      }
    }
    
    return vehicleData;
  }

  async startLogging(
    pids: string[], 
    callback: (data: VehicleData) => void,
    interval: number = 100
  ): Promise<() => void> {
    let isLogging = true;
    
    const logLoop = async () => {
      while (isLogging) {
        const data = await this.readMultipleParameters(pids);
        callback(data);
        await this.delay(interval);
      }
    };
    
    // Start logging in background
    logLoop();
    
    // Return stop function
    return () => {
      isLogging = false;
    };
  }

  private parseOBD2Response(response: string): number[] | null {
    // Remove spaces and non-hex characters
    const cleaned = response.replace(/[^0-9A-Fa-f]/g, '');
    
    // Check if response is valid
    if (cleaned.length < 4 || cleaned === 'NODATA') {
      return null;
    }
    
    // Parse hex bytes
    const bytes: number[] = [];
    for (let i = 4; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    
    return bytes;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if Web Bluetooth is available
  static isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Get connection status
  isConnected(): boolean {
    return this.server?.connected || false;
  }
}

const obd2BluetoothServiceSingleton = new OBD2BluetoothService();
export default obd2BluetoothServiceSingleton;
