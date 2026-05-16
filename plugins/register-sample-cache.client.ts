export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registerSampleCache = () => {
    navigator.serviceWorker.register('/sample-cache-sw.js').catch((error) => {
      console.warn('Sample cache service worker registration failed', error)
    })
  }

  if (document.readyState === 'complete') {
    registerSampleCache()
    return
  }

  window.addEventListener('load', registerSampleCache, { once: true })
})
