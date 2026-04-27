import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../constants/Storage';

const useCallHistoryStore = create(
  persist(
    (set, get) => ({
      callHistory: [],

      addCallRecord: (record) => {
        const { callHistory } = get();
        // Record: { id, participantName, participantAvatar, callType, status, timestamp, duration }
        set({ callHistory: [record, ...callHistory].slice(0, 50) }); // Keep last 50 calls
      },

      clearHistory: () => set({ callHistory: [] }),
    }),
    {
      name: 'call-history-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

export default useCallHistoryStore;
