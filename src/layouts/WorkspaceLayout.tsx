import { ReactNode } from 'react'
import { NavRail } from '../components/NavRail'
import { HeaderBar } from '../components/HeaderBar'

interface WorkspaceLayoutProps {
  children: ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="workspace-shell">
      <NavRail />
      <div className="workspace-main">
        <HeaderBar />
        <main>{children}</main>
      </div>
    </div>
  )
}
