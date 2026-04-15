import { lazy, Suspense } from 'react'
import { WorkspaceLayout } from '../layouts/WorkspaceLayout'

const MatrixPage = lazy(() => import('../features/matrix/MatrixView'))
const CalendarPlaceholder = lazy(() => import('../features/calendar/CalendarPlaceholder'))
const RemindersPlaceholder = lazy(() => import('../features/reminders/RemindersPlaceholder'))
const InsightsPlaceholder = lazy(() => import('../features/insights/InsightsPlaceholder'))
const SettingsView = lazy(() => import('../features/settings/SettingsView'))

export const routesConfig = [
  {
    path: '/',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <MatrixPage />
        </Suspense>
      </WorkspaceLayout>
    )
  },
  {
    path: '/matrix',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <MatrixPage />
        </Suspense>
      </WorkspaceLayout>
    )
  },
  {
    path: '/calendar',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <CalendarPlaceholder />
        </Suspense>
      </WorkspaceLayout>
    )
  },
  {
    path: '/reminders',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <RemindersPlaceholder />
        </Suspense>
      </WorkspaceLayout>
    )
  },
  {
    path: '/insights',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <InsightsPlaceholder />
        </Suspense>
      </WorkspaceLayout>
    )
  },
  {
    path: '/settings',
    element: (
      <WorkspaceLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <SettingsView />
        </Suspense>
      </WorkspaceLayout>
    )
  }
]
