import "server-only"

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

export const AUTH_RATE_LIMIT_WINDOW_MS = parsePositiveNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000)
export const AUTH_RATE_LIMIT_MAX_REQUESTS = parsePositiveNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20)
export const WEBHOOK_RATE_LIMIT_WINDOW_MS = parsePositiveNumber(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS, 60_000)
export const WEBHOOK_RATE_LIMIT_MAX_REQUESTS = parsePositiveNumber(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS, 60)
