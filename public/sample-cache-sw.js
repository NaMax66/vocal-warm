const sampleCacheName = 'vocalwarm-sample-cache-v1'
const sampleUrlPatterns = [
  'cdn.jsdelivr.net/npm/@audio-samples/piano-velocity',
  'gleitz.github.io/midi-js-soundfonts/FluidR3_GM/church_organ-mp3.js'
]

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function isSampleRequest(request) {
  if (request.method !== 'GET') {
    return false
  }

  return sampleUrlPatterns.some((pattern) => request.url.includes(pattern))
}

self.addEventListener('fetch', (event) => {
  if (!isSampleRequest(event.request)) {
    return
  }

  event.respondWith(
    caches.open(sampleCacheName).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)
      if (cachedResponse) {
        return cachedResponse
      }

      const networkResponse = await fetch(event.request)
      if (networkResponse.ok) {
        try {
          await cache.put(event.request, networkResponse.clone())
        } catch (error) {
          console.warn('Sample cache write failed', error)
        }
      }

      return networkResponse
    })
  )
})
