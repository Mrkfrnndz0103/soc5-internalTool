import "server-only"
import { query } from "@/lib/db"

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
  const intervalText = `${windowSeconds} seconds`

  const result = await query<{ count: number; expires_at: Date }>(
    `INSERT INTO session_rate_limits (session_id, count, expires_at)
     VALUES ($1, 1, NOW() + $2::interval)
     ON CONFLICT (session_id)
     DO UPDATE SET
       count = CASE WHEN session_rate_limits.expires_at < NOW() THEN 1 ELSE session_rate_limits.count + 1 END,
       expires_at = CASE WHEN session_rate_limits.expires_at < NOW() THEN NOW() + $2::interval ELSE session_rate_limits.expires_at END
     RETURNING count, expires_at`,
    [sessionId, intervalText]
  )

  const row = result.rows[0]
  const count = row?.count ?? limit + 1
  if (count > limit) {
    const expiresAt = row?.expires_at ? new Date(row.expires_at).getTime() : Date.now() + windowMs
    const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000))
    return { allowed: false, retryAfterSeconds, limit }
  }

  return { allowed: true, retryAfterSeconds: 0, limit }
}
