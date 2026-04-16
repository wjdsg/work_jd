// Author: mjw
// Date: 2026-04-15

interface ShortcutHelpProps {
  open: boolean
  onClose: () => void
}

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  if (!open) return null

  return (
    <div className="shortcut-help-overlay" role="dialog" aria-modal="true" aria-label="快捷键说明">
      <div className="shortcut-help-card">
        <header>
          <h3>快捷键说明</h3>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <ul>
          <li>方向键：在四象限间移动任务</li>
          <li>回车：打开任务详情</li>
          <li>Esc：关闭弹窗或抽屉</li>
        </ul>
      </div>
    </div>
  )
}
