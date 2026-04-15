// Author: mjw
// Date: 2026-04-15

import { useMemo, useState } from 'react'
import { createBackupService } from '../../services/backupService'

interface BackupPanelProps {
  onStatus: (message: string) => void
}

export function BackupPanel({ onStatus }: BackupPanelProps) {
  const backupService = useMemo(() => createBackupService(), [])
  const [importValue, setImportValue] = useState('')

  async function handleExportJSON() {
    const json = await backupService.exportJSON()
    onStatus(`Exported JSON (${json.length} chars)`)
  }

  async function handleExportCSV() {
    const csv = await backupService.exportCSV()
    onStatus(`Exported CSV (${csv.split('\n').length - 1} rows)`)
  }

  async function handleImport() {
    try {
      const report = await backupService.importJSON(importValue)
      const warning = report.warnings.length > 0 ? `, warning: ${report.warnings.join('; ')}` : ''
      onStatus(`Import completed (${report.taskCount} tasks, ${report.reminderCount} reminders${warning})`)
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Import failed')
    }
  }

  return (
    <section className="settings-panel" aria-label="Backup panel">
      <h3>Backup</h3>
      <div className="settings-inline-actions">
        <button type="button" onClick={handleExportJSON}>
          Export JSON
        </button>
        <button type="button" onClick={handleExportCSV}>
          Export CSV
        </button>
      </div>
      <label className="settings-field" htmlFor="backup-import-json">
        <span>Import JSON</span>
        <textarea
          id="backup-import-json"
          value={importValue}
          onChange={(event) => setImportValue(event.target.value)}
          rows={8}
          placeholder="Paste backup payload here"
        />
      </label>
      <button type="button" onClick={handleImport}>
        Import Backup
      </button>
    </section>
  )
}
