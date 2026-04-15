export const notificationBridge = {
  async requestPermission() {
    if (!('Notification' in window)) return 'denied'
    return Notification.requestPermission()
  },
  async showNative(payload: { title: string; body: string }) {
    if (!('Notification' in window)) throw new Error('Notification API not supported')
    return new Notification(payload.title, { body: payload.body })
  },
  showToast(payload: { title: string; body: string }) {
    console.info('Toast:', payload.title, payload.body)
  },
}
