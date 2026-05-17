type ClientLogPayload = {
  source: string
  message: string
  stack?: string
  detail?: unknown
  userAgent: string
  url: string
}

function stringifyErrorDetail(detail: unknown) {
  if (detail instanceof Error) {
    return {
      name: detail.name,
      message: detail.message,
      stack: detail.stack
    }
  }

  return detail
}

function sendClientLog(payload: Omit<ClientLogPayload, 'userAgent' | 'url'>) {
  $fetch('/api/client-log', {
    method: 'POST',
    body: {
      ...payload,
      userAgent: navigator.userAgent,
      url: window.location.href
    } satisfies ClientLogPayload
  }).catch(() => {})
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    sendClientLog({
      source: 'vue:errorHandler',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      detail: {
        info,
        componentName: instance?.$options?.name
      }
    })
  }

  nuxtApp.hook('app:error', (error) => {
    sendClientLog({
      source: 'nuxt:app:error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      detail: stringifyErrorDetail(error)
    })
  })

  window.addEventListener('error', (event) => {
    sendClientLog({
      source: 'window:error',
      message: event.message,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      detail: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: stringifyErrorDetail(event.error)
      }
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    sendClientLog({
      source: 'window:unhandledrejection',
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      detail: stringifyErrorDetail(event.reason)
    })
  })
})
