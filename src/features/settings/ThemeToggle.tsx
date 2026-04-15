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
      <span>Theme</span>
      <select id="settings-theme" value={theme} onChange={(event) => onChange(event.target.value as UserSettings['theme'])}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  )
}
