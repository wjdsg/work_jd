// Author: mjw
// Date: 2026-04-15

const CACHE_NAME = 'importance-urgency-shell-v1'
const SHELL_ASSETS = ['/', '/index.html']

type ServiceWorkerLifecycleEvent = Event & {
  waitUntil: (promise: Promise<unknown>) => void
}

type ServiceWorkerFetchEvent = Event & {
  request: Request
  respondWith: (response: Promise<Response> | Response) => void
}

self.addEventListener('install', (event) => {
  const lifecycleEvent = event as ServiceWorkerLifecycleEvent
  lifecycleEvent.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS)
    }),
  )
})

self.addEventListener('activate', (event) => {
  const lifecycleEvent = event as ServiceWorkerLifecycleEvent
  lifecycleEvent.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            return caches.delete(key)
          }),
      )
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as ServiceWorkerFetchEvent
  if (fetchEvent.request.method !== 'GET') return
  const url = new URL(fetchEvent.request.url)
  if (url.origin !== self.location.origin) return
  const pathname = url.pathname
  const isStaticAsset =
    pathname.startsWith('/assets/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  if (!isStaticAsset && pathname !== '/' && pathname !== '/index.html') return

  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(fetchEvent.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse
          const cloned = networkResponse.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(fetchEvent.request, cloned))
          return networkResponse
        })
        .catch(() => caches.match('/index.html'))
    }),
  )
})

export {}
