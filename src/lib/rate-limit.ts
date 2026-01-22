import "server-only"
import { getSessionRateLimit, incrementSessionRateLimit, resetSessionRateLimit } from "@/server/repositories/session-rate-limits"

function parsePositiveNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const DEFAULT_WINDOW_MS = parsePositiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000)
const DEFAULT_MAX_REQUESTS = parsePositiveNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 60)

type RateLimitResult =
  | { allowed: true; retryAfterSeconds: 0; limit: number }
  | { allowed: false; retryAfterSeconds: number; limit: number }

export async function enforceSessionRateLimit(
  sessionId: string,
  options?: { windowMs?: number; limit?: number }
): Promise<RateLimitResult> {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS
  const limit = options?.limit ?? DEFAULT_MAX_REQUESTS
  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000))
  const expiresAt = new Date(Date.now() + windowSeconds * 1000)
  const current = await getSessionRateLimit(sessionId)
  let count = limit + 1
  let currentExpiresAt = expiresAt

  if (!current || current.expiresAt.getTime() < Date.now()) {
    await resetSessionRateLimit(sessionId, expiresAt)
    count = 1
    currentExpiresAt = expiresAt
  } else {
    const updated = await incrementSessionRateLimit(sessionId)
    count = updated.count
    currentExpiresAt = updated.expiresAt
  }

  if (count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((currentExpiresAt.getTime() - Date.now()) / 1000))
    return { allowed: false, retryAfterSeconds, limit }
  }

  return { allowed: true, retryAfterSeconds: 0, limit }
}
