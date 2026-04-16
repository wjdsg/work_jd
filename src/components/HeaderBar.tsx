export function HeaderBar() {
  const now = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return (
    <header className="header-bar">
      <div className="workspace-meta">
        <span className="workspace-date">{now}</span>
        <button type="button" className="shortcut-button">
          快捷键
        </button>
      </div>
    </header>
  )
}
