import { WorkspaceLayout } from './layouts/WorkspaceLayout'

export function App({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>
}

export default App
