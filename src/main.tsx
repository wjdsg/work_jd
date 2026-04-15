// Author: mjw
// Date: 2026-04-13

import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './routes'
import { usePersistentStore } from './hooks/usePersistentStore'
import { useBroadcastSync } from './hooks/useBroadcastSync'
import { useAppTelemetry } from './hooks/useAppTelemetry'
import './styles/global.css'

export function Root() {
  usePersistentStore()
  useBroadcastSync()
  useAppTelemetry()
  return <AppRouter />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
