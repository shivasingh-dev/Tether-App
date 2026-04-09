import { create } from 'zustand'
import { persist } from 'zustand/middleware'



const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({theme}) 
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ step: state.step, userPhoneData: state.userPhoneData })
    }
  )
)

export default useThemeStore
