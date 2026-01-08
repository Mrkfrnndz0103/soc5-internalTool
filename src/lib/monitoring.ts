import * as Sentry from "@sentry/nextjs"

const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

export function captureException(error: unknown, context?: { requestId?: string; route?: string; method?: string }) {
  if (!sentryEnabled) return
  Sentry.withScope((scope) => {
    if (context?.requestId) scope.setTag("request_id", context.requestId)
    if (context?.route) scope.setTag("route", context.route)
    if (context?.method) scope.setTag("method", context.method)
    Sentry.captureException(error)
  })
}
