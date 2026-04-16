// Author: mjw
// Date: 2026-04-15

import type { UserSettings } from '../../models/settings'

interface ThemeToggleProps {
  theme: UserSettings['theme']
  onChange: (theme: UserSettings['theme']) => void
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <label className="settings-field" htmlFor="settings-theme">
      <span>主题模式</span>
      <select id="settings-theme" value={theme} onChange={(event) => onChange(event.target.value as UserSettings['theme'])}>
        <option value="system">跟随系统</option>
        <option value="light">浅色模式</option>
        <option value="dark">深色模式</option>
      </select>
    </label>
  )
}
