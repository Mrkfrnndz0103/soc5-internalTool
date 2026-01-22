import "server-only"

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const MAX_ENTRIES = Number(process.env.SERVER_CACHE_MAX_ENTRIES || "500")

function pruneCache() {
  if (!Number.isFinite(MAX_ENTRIES) || MAX_ENTRIES <= 0) return
  if (cache.size <= MAX_ENTRIES) return
  cache.clear()
}

function isExpired(entry: CacheEntry<unknown>) {
  return entry.expiresAt <= Date.now()
}

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (isExpired(entry)) {
    cache.delete(key)
    return undefined
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
  pruneCache()
}

export async function withCache<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const cached = getCache<T>(key)
  if (cached !== undefined) return cached
  const value = await factory()
  setCache(key, value, ttlMs)
  return value
}

export function invalidateCache(prefix: string) {
  if (!prefix) return
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}
