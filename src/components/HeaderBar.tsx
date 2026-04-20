export function HeaderBar() {
  const appVersion = typeof __APP_VERSION__ === 'undefined' ? 'dev' : __APP_VERSION__
  const now = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return (
    <header className="header-bar">
      <div className="workspace-meta">
        <span className="workspace-badge" title="Core Matrix">
          ◆ Core Matrix
        </span>
        <span className="workspace-date">{now}</span>
        <span className="workspace-version" title="当前应用版本">
          v{appVersion}
        </span>
        <button type="button" className="shortcut-button">
          快捷键
        </button>
      </div>
    </header>
  )
}
