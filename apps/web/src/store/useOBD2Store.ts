import { create } from 'zustand';
import { VehicleData, ConnectionStatus, OBD2Reading } from '../types/obd2.types';
import obd2Service from '../services/obd2BluetoothService';

interface LoggingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  parameters: string[];
  readings: OBD2Reading[];
  isActive: boolean;
}

interface OBD2Store {
  // Connection state
  connectionStatus: ConnectionStatus;
  
  // Current vehicle data
  currentData: VehicleData;
  
  // Logging state
  isLogging: boolean;
  selectedParameters: string[];
  loggingInterval: number;
  currentSession: LoggingSession | null;
  sessions: LoggingSession[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startLogging: () => Promise<void>;
  stopLogging: () => void;
  setSelectedParameters: (parameters: string[]) => void;
  setLoggingInterval: (interval: number) => void;
  exportSession: (sessionId: string) => void;
}

const useOBD2Store = create<OBD2Store>((set, get) => ({
  // Initial state
  connectionStatus: { isConnected: false },
  currentData: {},
  isLogging: false,
  selectedParameters: ['010C', '010D', '0105', '010F', '0111', '0170'],
  loggingInterval: 100,
  currentSession: null,
  sessions: [],
  
  // Connect to OBD2 device
  connect: async () => {
    const status = await obd2Service.connect();
    set({ connectionStatus: status });
  },
  
  // Disconnect from OBD2 device
  disconnect: async () => {
    const { isLogging } = get();
    if (isLogging) {
      get().stopLogging();
    }
    await obd2Service.disconnect();
    set({ 
      connectionStatus: { isConnected: false },
      currentData: {}
    });
  },
  
  // Start logging data
  startLogging: async () => {
    const { selectedParameters, loggingInterval } = get();
    
    // Create new session
    const session: LoggingSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      parameters: selectedParameters,
      readings: [],
      isActive: true
    };
    
    set({ 
      isLogging: true,
      currentSession: session
    });
    
    // Start logging loop
    const stopFunction = await obd2Service.startLogging(
      selectedParameters,
      (data) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        // Update current data
        set({ currentData: data });
        
        // Add readings to session
        const readings: OBD2Reading[] = [];
        const timestamp = new Date();
        
        // Convert VehicleData to OBD2Readings
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            readings.push({
              parameter: key,
              value,
              unit: getUnitForParameter(key),
              timestamp
            });
          }
        });
        
        // Update session
        set(state => ({
          currentSession: state.currentSession ? {
            ...state.currentSession,
            readings: [...state.currentSession.readings, ...readings]
          } : null
        }));
      },
      loggingInterval
    );
    
    // Store stop function
    (window as any).__stopLogging = stopFunction;
  },
  
  // Stop logging data
  stopLogging: () => {
    // Call stop function if it exists
    if ((window as any).__stopLogging) {
      (window as any).__stopLogging();
      delete (window as any).__stopLogging;
    }
    
    const { currentSession } = get();
    if (currentSession) {
      // Finalize session
      const finalizedSession = {
        ...currentSession,
        endTime: new Date(),
        isActive: false
      };
      
      set(state => ({
        isLogging: false,
        currentSession: null,
        sessions: [...state.sessions, finalizedSession]
      }));
    } else {
      set({ isLogging: false });
    }
  },
  
  // Set selected parameters
  setSelectedParameters: (parameters) => {
    set({ selectedParameters: parameters });
  },
  
  // Set logging interval
  setLoggingInterval: (interval) => {
    set({ loggingInterval: interval });
  },
  
  // Export session data
  exportSession: (sessionId) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return;
    
    // Convert to CSV format
    const headers = ['Timestamp', ...session.parameters];
    const rows = [headers.join(',')];
    
    // Group readings by timestamp
    const readingsByTime = new Map<number, Record<string, number>>();
    
    session.readings.forEach(reading => {
      const time = reading.timestamp.getTime();
      if (!readingsByTime.has(time)) {
        readingsByTime.set(time, {});
      }
      readingsByTime.get(time)![reading.parameter] = reading.value;
    });
    
    // Create CSV rows
    readingsByTime.forEach((data, timestamp) => {
      const row = [new Date(timestamp).toISOString()];
      session.parameters.forEach(param => {
        row.push(data[param]?.toString() || '');
      });
      rows.push(row.join(','));
    });
    
    // Download CSV
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obd2_log_${sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}));

// Helper function to get unit for parameter
function getUnitForParameter(parameter: string): string {
  const units: Record<string, string> = {
    rpm: 'rpm',
    speed: 'km/h',
    coolantTemp: '°C',
    intakeTemp: '°C',
    throttlePosition: '%',
    engineLoad: '%',
    timingAdvance: '°',
    maf: 'g/s',
    boostPressure: 'PSI',
    engineOilTemp: '°C',
    fuelRailPressure: 'kPa',
    fuelLevel: '%',
    barometricPressure: 'kPa',
    turboRpm: 'rpm'
  };
  
  return units[parameter] || '';
}

export default useOBD2Store;
