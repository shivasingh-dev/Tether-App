import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';


// MMKV Instance create karein
export const storage = new MMKV();

// Zustand ke liye custom storage handler
const mmkvStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
};

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null, // Token ke liye naya state
      isAuthenticated: false,
      
      // Login hone par user aur token dono save karein
      setUser: (userData, token) => 
        set({ 
          user: userData, 
          token: token, 
          isAuthenticated: true 
        }),

      clearUser: () => 
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: "user-auth-storage",
      storage: createJSONStorage(() => mmkvStorage), 
    }
  )
);

export default useUserStore;