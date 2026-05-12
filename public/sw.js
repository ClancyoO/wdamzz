const CACHE_NAME = 'amz-tools-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', {
        status: 403,
        headers: { 'Content-Type': 'text/javascript' }
      }))
    )
    return
  }
  event.respondWith(fetch(event.request))
})
