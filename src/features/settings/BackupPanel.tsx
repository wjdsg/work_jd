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
    onStatus(`已导出 JSON（${json.length} 字符）`)
  }

  async function handleExportCSV() {
    const csv = await backupService.exportCSV()
    onStatus(`已导出 CSV（${csv.split('\n').length - 1} 行）`)
  }

  async function handleImport() {
    try {
      const report = await backupService.importJSON(importValue)
      const warning = report.warnings.length > 0 ? `，警告：${report.warnings.join('；')}` : ''
      onStatus(`导入完成（${report.taskCount} 条任务，${report.reminderCount} 条提醒${warning}）`)
    } catch (error) {
      onStatus(error instanceof Error ? error.message : '导入失败')
    }
  }

  return (
    <section className="settings-panel" aria-label="备份面板">
      <h3>备份与恢复</h3>
      <div className="settings-inline-actions">
        <button type="button" onClick={handleExportJSON}>
          导出 JSON
        </button>
        <button type="button" onClick={handleExportCSV}>
          导出 CSV
        </button>
      </div>
      <label className="settings-field" htmlFor="backup-import-json">
        <span>导入 JSON</span>
        <textarea
          id="backup-import-json"
          value={importValue}
          onChange={(event) => setImportValue(event.target.value)}
          rows={8}
          placeholder="将备份内容粘贴到此处"
        />
      </label>
      <button type="button" onClick={handleImport}>
        导入备份
      </button>
    </section>
  )
}
