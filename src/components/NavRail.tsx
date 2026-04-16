import { NavLink } from 'react-router-dom'

const links = [
  { to: '/matrix', label: '矩阵面板' },
  { to: '/calendar', label: '日历规划' },
  { to: '/reminders', label: '提醒中心' },
  { to: '/insights', label: '洞察驾驶舱' },
  { to: '/settings', label: '系统设置' },
]

export function NavRail() {
  return (
    <nav className="nav-rail">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
