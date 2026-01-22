import "server-only"

type MetricsState = {
  startedAt: number
  requestsTotal: number
  errorsTotal: number
}

const metrics: MetricsState = {
  startedAt: Date.now(),
  requestsTotal: 0,
  errorsTotal: 0,
}

export function recordRequest(status: number) {
  metrics.requestsTotal += 1
  if (status >= 500) {
    metrics.errorsTotal += 1
  }
}

export function getMetricsSnapshot() {
  return {
    uptime_seconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
    requests_total: metrics.requestsTotal,
    errors_total: metrics.errorsTotal,
  }
}
