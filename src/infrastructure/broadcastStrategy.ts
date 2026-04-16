export interface BroadcastStrategy {
  publish(event: unknown): void
  subscribe(listener: (event: MessageEvent) => void): () => void
  supportsNative: boolean
}

export function createBroadcastStrategy(channelName: string): BroadcastStrategy {
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(channelName)
    return {
      publish(event) {
        channel.postMessage(event)
      },
      subscribe(listener) {
        channel.addEventListener('message', listener)
        return () => channel.removeEventListener('message', listener)
      },
      supportsNative: true,
    }
  }

  return {
    publish(event) {
      localStorage.setItem(channelName, JSON.stringify(event))
    },
    subscribe(listener) {
      const handler = (e: StorageEvent) => {
        if (e.key === channelName && e.newValue) {
          try {
            listener(new MessageEvent('storage', { data: JSON.parse(e.newValue) }))
          } catch {
            return
          }
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
    supportsNative: false,
  }
}
