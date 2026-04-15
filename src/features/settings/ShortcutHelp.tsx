// Author: mjw
// Date: 2026-04-15

interface ShortcutHelpProps {
  open: boolean
  onClose: () => void
}

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  if (!open) return null

  return (
    <div className="shortcut-help-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcut-help-card">
        <header>
          <h3>Keyboard Shortcuts</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <ul>
          <li>Arrow keys: move task between quadrants</li>
          <li>Enter: open task details</li>
          <li>Esc: close dialog or drawer</li>
        </ul>
      </div>
    </div>
  )
}
