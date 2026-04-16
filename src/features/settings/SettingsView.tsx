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
    setStatusMessage('数据库重置完成')
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
        <h2>系统设置</h2>
        <p className="sync-chip">同步状态：{syncStatus === 'native' ? '原生通道' : '降级模式'}</p>
      </header>

      <section className="settings-panel" aria-label="通用设置">
        <ThemeToggle theme={settings.theme} onChange={(theme) => setSettings({ theme })} />

        <label className="settings-field" htmlFor="settings-timezone">
          <span>时区</span>
          <input
            id="settings-timezone"
            value={settings.timezone}
            onChange={(event) => setSettings({ timezone: event.target.value })}
          />
        </label>

        <label className="settings-field" htmlFor="threshold-importance">
          <span>重要性阈值</span>
          <input
            id="threshold-importance"
            type="range"
            min={1}
            max={10}
            step={1}
            value={settings.quadrantThreshold.importance}
            onChange={(event) => handleThresholdChange('importance', Number(event.target.value))}
          />
        </label>

        <label className="settings-field" htmlFor="threshold-urgency">
          <span>紧急性阈值</span>
          <input
            id="threshold-urgency"
            type="range"
            min={1}
            max={10}
            step={1}
            value={settings.quadrantThreshold.urgency}
            onChange={(event) => handleThresholdChange('urgency', Number(event.target.value))}
          />
        </label>

        <button type="button" onClick={() => setIsShortcutOpen(true)}>
          快捷键说明
        </button>
      </section>

      <BackupPanel onStatus={setStatusMessage} />

      <section className="settings-panel" aria-label="风险与诊断">
        {migrationError ? <p className="warning-text">检测到迁移异常：{migrationError}</p> : null}
        {quotaRatio > 0.8 ? <p className="warning-text">隐私模式预警：本地存储配额接近上限。</p> : null}
        {showClockWarning ? <p className="warning-text">检测到时钟漂移，提醒触发可能不准确。</p> : null}
        <button type="button" className="danger-button" onClick={handleResetDatabase}>
          重置数据库
        </button>
      </section>

      {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
      <ShortcutHelp open={isShortcutOpen} onClose={() => setIsShortcutOpen(false)} />
    </div>
  )
}
