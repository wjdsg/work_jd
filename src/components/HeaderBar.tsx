import { format } from 'date-fns'

export function HeaderBar() {
  const now = format(new Date(), 'PPP')
  return (
    <header className="header-bar">
      <div className="workspace-meta">
        <span className="workspace-date">{now}</span>
        <button type="button" className="shortcut-button">
          Shortcuts
        </button>
      </div>
    </header>
  )
}
