type CacheControlOptions = {
  scope?: "private" | "public"
  maxAgeSeconds: number
  staleWhileRevalidateSeconds?: number
}

export const NO_STORE = "no-store"

export function toCacheSeconds(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return Math.max(1, Math.floor(ms / 1000))
}

export function buildCacheControl(options: CacheControlOptions) {
  const scope = options.scope ?? "private"
  const parts = [scope, `max-age=${Math.max(0, options.maxAgeSeconds)}`]
  const staleWhileRevalidateSeconds = options.staleWhileRevalidateSeconds ?? 0
  if (staleWhileRevalidateSeconds > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidateSeconds}`)
  }
  return parts.join(", ")
}
