import { create } from 'zustand';
import { VehicleData, ConnectionStatus, OBD2Reading } from '../types/obd2.types';
import obd2Service from '../services/obd2BluetoothService';
import {
  createSession,
  updateSession,
  bulkCreateLogs,
  type SessionSummary,
} from '../services/sessionService';

interface LoggingSession {
  id: string;
  remoteId?: number;
  startTime: Date;
  endTime?: Date;
  parameters: string[];
  readings: OBD2Reading[];
  isActive: boolean;
}

const LOG_BATCH_SIZE = 50;

interface OBD2Store {
  connectionStatus: ConnectionStatus;
  currentData: VehicleData;
  isLogging: boolean;
  selectedParameters: string[];
  loggingInterval: number;
  currentSession: LoggingSession | null;
  sessions: SessionSummary[];
  activeVehicleId: number | null;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startLogging: () => Promise<void>;
  stopLogging: () => Promise<void>;
  setSelectedParameters: (parameters: string[]) => void;
  setLoggingInterval: (interval: number) => void;
  setActiveVehicleId: (id: number | null) => void;
  setSessions: (sessions: SessionSummary[]) => void;
}

let stopLoggingFn: (() => void) | null = null;
let pendingBatch: { timestamp: string; data: Record<string, number> }[] = [];

const useOBD2Store = create<OBD2Store>((set, get) => ({
  connectionStatus: { isConnected: false },
  currentData: {},
  isLogging: false,
  selectedParameters: ['010C', '010D', '0105', '010F', '0111', '0170'],
  loggingInterval: 100,
  currentSession: null,
  sessions: [],
  activeVehicleId: null,

  connect: async () => {
    const status = await obd2Service.connect();
    set({ connectionStatus: status });
  },

  disconnect: async () => {
    const { isLogging } = get();
    if (isLogging) {
      await get().stopLogging();
    }
    await obd2Service.disconnect();
    set({
      connectionStatus: { isConnected: false },
      currentData: {},
    });
  },

  startLogging: async () => {
    const { selectedParameters, loggingInterval, activeVehicleId } = get();
    pendingBatch = [];

    let remoteSession: SessionSummary | undefined;
    try {
      remoteSession = await createSession({
        vehicle_id: activeVehicleId,
        start_time: new Date().toISOString(),
        parameters: selectedParameters,
      });
    } catch {
      // continue with local-only if backend is unreachable
    }

    const session: LoggingSession = {
      id: Date.now().toString(),
      remoteId: remoteSession?.id,
      startTime: new Date(),
      parameters: selectedParameters,
      readings: [],
      isActive: true,
    };

    set({
      isLogging: true,
      currentSession: session,
    });

    const stop = await obd2Service.startLogging(
      selectedParameters,
      (data) => {
        const { currentSession } = get();
        if (!currentSession) return;

        set({ currentData: data });

        const timestamp = new Date();
        const readings: OBD2Reading[] = [];
        const dataRecord: Record<string, number> = {};

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            readings.push({ parameter: key, value, unit: getUnitForParameter(key), timestamp });
            dataRecord[key] = value;
          }
        });

        pendingBatch.push({ timestamp: timestamp.toISOString(), data: dataRecord });

        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, readings: [...state.currentSession.readings, ...readings] }
            : null,
        }));

        if (currentSession.remoteId && pendingBatch.length >= LOG_BATCH_SIZE) {
          const toSend = [...pendingBatch];
          pendingBatch = [];
          bulkCreateLogs(currentSession.remoteId, toSend).catch(() => {
            pendingBatch.unshift(...toSend);
          });
        }
      },
      loggingInterval,
    );

    stopLoggingFn = stop;
  },

  stopLogging: async () => {
    if (stopLoggingFn) {
      stopLoggingFn();
      stopLoggingFn = null;
    }

    const { currentSession } = get();
    if (currentSession) {
      const endTime = new Date();

      if (currentSession.remoteId) {
        if (pendingBatch.length > 0) {
          const toSend = [...pendingBatch];
          pendingBatch = [];
          try {
            await bulkCreateLogs(currentSession.remoteId, toSend);
          } catch { /* best effort */ }
        }
        try {
          await updateSession(currentSession.remoteId, {
            vehicle_id: null,
            start_time: currentSession.startTime.toISOString(),
            end_time: endTime.toISOString(),
            parameters: currentSession.parameters,
          });
        } catch { /* best effort */ }
      }

      set((state) => ({
        isLogging: false,
        currentSession: null,
        sessions: [
          {
            id: currentSession.remoteId || parseInt(currentSession.id),
            vehicle_id: null,
            start_time: currentSession.startTime.toISOString(),
            end_time: endTime.toISOString(),
            parameters: currentSession.parameters,
            notes: null,
            log_count: currentSession.readings.length,
          },
          ...state.sessions,
        ],
      }));
    } else {
      set({ isLogging: false });
    }
    pendingBatch = [];
  },

  setSelectedParameters: (parameters) => {
    set({ selectedParameters: parameters });
  },

  setLoggingInterval: (interval) => {
    set({ loggingInterval: interval });
  },

  setActiveVehicleId: (id) => {
    set({ activeVehicleId: id });
  },

  setSessions: (sessions) => {
    set({ sessions });
  },
}));

function getUnitForParameter(parameter: string): string {
  const units: Record<string, string> = {
    rpm: 'rpm',
    speed: 'km/h',
    coolantTemp: '\u00B0C',
    intakeTemp: '\u00B0C',
    throttlePosition: '%',
    engineLoad: '%',
    timingAdvance: '\u00B0',
    maf: 'g/s',
    boostPressure: 'PSI',
    engineOilTemp: '\u00B0C',
    fuelRailPressure: 'kPa',
    fuelLevel: '%',
    barometricPressure: 'kPa',
    turboRpm: 'rpm',
  };
  return units[parameter] || '';
}

export default useOBD2Store;
