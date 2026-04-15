import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'

export function useBroadcastSync() {
  useEffect(() => {
    let channel: BroadcastChannel | null = null
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('importance-urgency-sync')
      useSettingsStore.getState().setSyncStatus('native')
    } else {
      useSettingsStore.getState().setSyncStatus('degraded')
    }

    const unsubscribe = useTaskStore.subscribe((state) => {
      channel?.postMessage({ type: 'TASKS_UPDATED', payload: state.tasks })
    })

    channel?.addEventListener('message', async (event) => {
      if (event.data?.type === 'TASKS_UPDATED') {
        useTaskStore.getState().hydrate(event.data.payload)
      }
    })

    return () => {
      unsubscribe()
      channel?.close()
    }
  }, [])
}
