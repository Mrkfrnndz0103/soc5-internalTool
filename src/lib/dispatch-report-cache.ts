const STORAGE_KEY = "soc5_dispatch_reports"
const MAX_REPORT_CACHE = 200
const REPORT_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000

type CacheableReport = {
  createdAt?: string
  statusUpdatedAt?: string
  date?: string
}

function getReportTimestamp(report: CacheableReport) {
  const candidates = [report.createdAt, report.statusUpdatedAt, report.date]
  for (const value of candidates) {
    if (!value) continue
    const parsed = new Date(value).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  return 0
}

function applyCachePolicy<T extends CacheableReport>(reports: T[]) {
  const now = Date.now()
  const filtered = reports.filter((report) => {
    const ts = getReportTimestamp(report)
    if (!ts) return true
    return now - ts <= REPORT_CACHE_TTL_MS
  })
  const sorted = [...filtered].sort((a, b) => getReportTimestamp(b) - getReportTimestamp(a))
  return sorted.slice(0, MAX_REPORT_CACHE)
}

export function loadDispatchReportCache<T extends CacheableReport>(): T[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const trimmed = applyCachePolicy(parsed as T[])
    if (trimmed.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    }
    return trimmed
  } catch {
    return []
  }
}

export function saveDispatchReportCache<T extends CacheableReport>(reports: T[]) {
  if (typeof window === "undefined") return
  const trimmed = applyCachePolicy(reports)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}
