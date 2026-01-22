import { getMetricsSnapshot, recordRequest } from "@/server/metrics"

describe("metrics", () => {
  it("increments request counters", () => {
    const before = getMetricsSnapshot()
    recordRequest(200)
    const after = getMetricsSnapshot()
    expect(after.requests_total).toBeGreaterThanOrEqual(before.requests_total + 1)
  })

  it("increments error counters for 5xx", () => {
    const before = getMetricsSnapshot()
    recordRequest(500)
    const after = getMetricsSnapshot()
    expect(after.errors_total).toBeGreaterThanOrEqual(before.errors_total + 1)
  })
})
