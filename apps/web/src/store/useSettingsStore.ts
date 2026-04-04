import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  autoConnect: boolean;
  highFrequencyLogging: boolean;
  extendedPids: boolean;
  imperialUnits: boolean;

  setAutoConnect: (v: boolean) => void;
  setHighFrequencyLogging: (v: boolean) => void;
  setExtendedPids: (v: boolean) => void;
  setImperialUnits: (v: boolean) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoConnect: false,
      highFrequencyLogging: false,
      extendedPids: true,
      imperialUnits: false,

      setAutoConnect: (v) => set({ autoConnect: v }),
      setHighFrequencyLogging: (v) => set({ highFrequencyLogging: v }),
      setExtendedPids: (v) => set({ extendedPids: v }),
      setImperialUnits: (v) => set({ imperialUnits: v }),
    }),
    { name: 'openlogger-settings' },
  ),
);

export default useSettingsStore;
