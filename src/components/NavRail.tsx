import { NavLink } from 'react-router-dom'

const links = [
  { to: '/matrix', label: 'Matrix' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' }
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
