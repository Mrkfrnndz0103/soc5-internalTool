import "server-only"
import { getCache, setCache } from "@/lib/server-cache"

type IpRateLimitOptions = {
  windowMs: number
  limit: number
}

type IpRateLimitResult =
  | { allowed: true; retryAfterSeconds: 0; limit: number }
  | { allowed: false; retryAfterSeconds: number; limit: number }

type Counter = {
  count: number
  expiresAt: number
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

export function enforceIpRateLimit(
  request: Request,
  keyPrefix: string,
  options: IpRateLimitOptions
): IpRateLimitResult {
  const ip = getClientIp(request)
  const key = `rate:${keyPrefix}:${ip}`
  const now = Date.now()
  const windowMs = options.windowMs
  const limit = options.limit

  const existing = getCache<Counter>(key)
  if (!existing) {
    const expiresAt = now + windowMs
    setCache(key, { count: 1, expiresAt }, windowMs)
    return { allowed: true, retryAfterSeconds: 0, limit }
  }

  if (existing.expiresAt <= now) {
    const expiresAt = now + windowMs
    setCache(key, { count: 1, expiresAt }, windowMs)
    return { allowed: true, retryAfterSeconds: 0, limit }
  }

  const nextCount = existing.count + 1
  const remainingMs = existing.expiresAt - now
  setCache(key, { count: nextCount, expiresAt: existing.expiresAt }, remainingMs)

  if (nextCount > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000))
    return { allowed: false, retryAfterSeconds, limit }
  }

  return { allowed: true, retryAfterSeconds: 0, limit }
}
