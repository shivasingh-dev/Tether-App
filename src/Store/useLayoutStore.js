import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../constants/Storage';

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: 'chats', 
      selectedContact: null,

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSelectedContact: (contact) => set({ selectedContact: contact }),

      resetLayout: () => set({ 
        selectedContact: null, 
        activeTab: 'chats' 
      }),
    }),
    {
      name: "layout-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ selectedContact: state.selectedContact }),
    }
  )
);

export default useLayoutStore;