const SESSION_STORAGE_KEY = 'vocalwarm:analytics-session-id'

function getSessionId() {
  const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (existingSessionId) {
    return existingSessionId
  }

  const sessionId = crypto.randomUUID()
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  return sessionId
}

function sendHumanAction(action: string) {
  const payload = {
    event: 'human_action',
    path: window.location.pathname,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    properties: {
      app: 'vocalwarm',
      action
    }
  }
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
  return {
    provide: {
      trackHumanAction: sendHumanAction
    }
  }
})
