// import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (data) => set({ user: data, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false })
    }),
    // {
    //   name: "user-auth-storage",
    //   storage: createJSONStorage(() => AsyncStorage), 
    // }
  )
);  

export default useUserStore