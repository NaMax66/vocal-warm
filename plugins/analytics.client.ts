const SESSION_STORAGE_KEY = 'vocalwarm:analytics-session-id'

type AnalyticsPayload = {
  event: string
  path: string
  sessionId: string
  timestamp: string
  properties: Record<string, unknown>
}

function getSessionId() {
  const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (existingSessionId) {
    return existingSessionId
  }

  const sessionId = crypto.randomUUID()
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  return sessionId
}

function sendAnalyticsEvent(payload: AnalyticsPayload) {
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon('/api/analytics', blob)) {
      return
    }
  }

  $fetch('/api/analytics', {
    method: 'POST',
    body: payload
  }).catch(() => {})
}

export default defineNuxtPlugin(() => {
  sendAnalyticsEvent({
    event: 'page_view',
    path: window.location.pathname,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    properties: {
      app: 'vocalwarm',
      referrer: document.referrer || null,
      url: window.location.href,
      userAgent: navigator.userAgent
    }
  })
})
