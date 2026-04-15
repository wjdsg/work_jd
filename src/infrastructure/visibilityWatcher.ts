export const visibilityWatcher = {
  subscribe(listener: (state: DocumentVisibilityState) => void) {
    const handler = () => listener(document.visibilityState)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  },
}
