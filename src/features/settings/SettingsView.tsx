// Author: mjw
// Date: 2026-04-15

import { useEffect, useMemo, useState } from 'react'
import { createStorageAdapter } from '../../storage/storageAdapter'
import { useReminderStore } from '../../store/reminderStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTaskStore } from '../../store/taskStore'
import { BackupPanel } from './BackupPanel'
import { ShortcutHelp } from './ShortcutHelp'
import { ThemeToggle } from './ThemeToggle'
import './styles/settings.css'

interface SettingsViewProps {
  clockDriftMsOverride?: number
}

export default function SettingsView({ clockDriftMsOverride }: SettingsViewProps) {
  const storageAdapter = useMemo(() => createStorageAdapter(), [])
  const { settings, syncStatus, migrationError, setSettings, setMigrationError } = useSettingsStore()
  const clearTasks = useTaskStore((state) => state.clear)
  const clearReminders = useReminderStore((state) => state.clear)

  const [statusMessage, setStatusMessage] = useState('')
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null)
  const [isShortcutOpen, setIsShortcutOpen] = useState(false)

  useEffect(() => {
    let canceled = false
    async function loadStorageEstimate() {
      if (!navigator.storage?.estimate) {
        setStorageInfo({ usage: 0, quota: 0 })
        return
      }
      const estimate = await navigator.storage.estimate()
      if (canceled) return
      setStorageInfo({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 })
    }
    void loadStorageEstimate()
    return () => {
      canceled = true
    }
  }, [])

  const driftMs = clockDriftMsOverride ?? Math.abs(Date.now() - new Date().getTime())
  const showClockWarning = driftMs > 120_000

  async function handleResetDatabase() {
    if (typeof indexedDB !== 'undefined') {
      await storageAdapter.reset()
    }
    clearTasks()
    clearReminders()
    setMigrationError(undefined)
    setStatusMessage('Database reset completed')
  }

  function handleThresholdChange(field: 'importance' | 'urgency', value: number) {
    setSettings({
      quadrantThreshold: {
        ...settings.quadrantThreshold,
        [field]: value,
      },
    })
  }

  const quotaRatio = storageInfo && storageInfo.quota > 0 ? storageInfo.usage / storageInfo.quota : 0

  return (
    <div className="settings-view">
      <header className="settings-header">
        <h2>Settings</h2>
        <p className="sync-chip">Sync: {syncStatus}</p>
      </header>

      <section className="settings-panel" aria-label="General settings">
        <ThemeToggle theme={settings.theme} onChange={(theme) => setSettings({ theme })} />

        <label className="settings-field" htmlFor="settings-timezone">
          <span>Timezone</span>
          <input
            id="settings-timezone"
            value={settings.timezone}
            onChange={(event) => setSettings({ timezone: event.target.value })}
          />
        </label>

        <label className="settings-field" htmlFor="threshold-importance">
          <span>Importance Threshold</span>
          <input
            id="threshold-importance"
            type="range"
            min={1}
            max={5}
            value={settings.quadrantThreshold.importance}
            onChange={(event) => handleThresholdChange('importance', Number(event.target.value))}
          />
        </label>

        <label className="settings-field" htmlFor="threshold-urgency">
          <span>Urgency Threshold</span>
          <input
            id="threshold-urgency"
            type="range"
            min={1}
            max={5}
            value={settings.quadrantThreshold.urgency}
            onChange={(event) => handleThresholdChange('urgency', Number(event.target.value))}
          />
        </label>

        <button type="button" onClick={() => setIsShortcutOpen(true)}>
          Shortcut Help
        </button>
      </section>

      <BackupPanel onStatus={setStatusMessage} />

      <section className="settings-panel" aria-label="Risk and diagnostics">
        {migrationError ? <p className="warning-text">Migration error detected: {migrationError}</p> : null}
        {quotaRatio > 0.8 ? <p className="warning-text">Privacy mode warning: storage quota is close to full.</p> : null}
        {showClockWarning ? <p className="warning-text">Clock drift detected. Reminders may be inaccurate.</p> : null}
        <button type="button" className="danger-button" onClick={handleResetDatabase}>
          Reset Database
        </button>
      </section>

      {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
      <ShortcutHelp open={isShortcutOpen} onClose={() => setIsShortcutOpen(false)} />
    </div>
  )
}
