import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../constants/Storage';

const useUserStore = create(
  persist(
    (set) => ({
      user: null, 
      token: null,
      isAuthenticated: false,

      setUser: (userData, token) => 
        set({ 
          user: userData, 
          token: token, 
          isAuthenticated: !!token 
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