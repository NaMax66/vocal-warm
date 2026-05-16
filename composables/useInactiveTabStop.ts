export function useInactiveTabStop(isListening: Ref<boolean>, stopListening: () => void) {
  const inactiveTabStopDelayMs = 30000
  let inactiveTabTimeoutId: ReturnType<typeof setTimeout> | null = null

  function clearInactiveTabTimeout() {
    if (!inactiveTabTimeoutId) {
      return
    }

    clearTimeout(inactiveTabTimeoutId)
    inactiveTabTimeoutId = null
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      clearInactiveTabTimeout()
      return
    }

    if (!isListening.value || inactiveTabTimeoutId) {
      return
    }

    inactiveTabTimeoutId = setTimeout(() => {
      inactiveTabTimeoutId = null

      if (document.visibilityState === 'hidden' && isListening.value) {
        stopListening()
      }
    }, inactiveTabStopDelayMs)
  }

  function startInactiveTabStop() {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function disposeInactiveTabStop() {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    clearInactiveTabTimeout()
  }

  return {
    startInactiveTabStop,
    disposeInactiveTabStop
  }
}
