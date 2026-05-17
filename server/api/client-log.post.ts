type ClientLogPayload = {
  source?: string
  message?: string
  stack?: string
  detail?: unknown
  userAgent?: string
  url?: string
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<ClientLogPayload>(event)

  console.error('[client-log]', {
    source: payload.source,
    message: payload.message,
    url: payload.url,
    userAgent: payload.userAgent,
    detail: payload.detail,
    stack: payload.stack
  })

  return { ok: true }
})
