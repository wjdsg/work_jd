import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { UserSettings, DEFAULT_SETTINGS } from '../models/settings'

export interface SettingsState {
  settings: UserSettings
  syncStatus: 'native' | 'degraded'
  migrationError?: string
  setSettings: (next: Partial<UserSettings>) => void
  setSyncStatus: (status: 'native' | 'degraded') => void
  setMigrationError: (message?: string) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  devtools((set) => ({
    settings: DEFAULT_SETTINGS,
    syncStatus: 'native',
    migrationError: undefined,
    setSettings: (next) => set((state) => ({ settings: { ...state.settings, ...next } })),
    setSyncStatus: (status) => set({ syncStatus: status }),
    setMigrationError: (message) => set({ migrationError: message }),
    reset: () => set({ settings: DEFAULT_SETTINGS, syncStatus: 'native', migrationError: undefined }),
  }))
)
