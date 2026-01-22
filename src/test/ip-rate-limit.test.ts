import { enforceIpRateLimit } from "@/server/ip-rate-limit"

const buildRequest = (ip: string) =>
  ({
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
  }) as Request

describe("enforceIpRateLimit", () => {
  it("allows first request within window", () => {
    const request = buildRequest("127.0.0.1")
    const result = enforceIpRateLimit(request, "test", { windowMs: 1000, limit: 1 })
    expect(result.allowed).toBe(true)
  })

  it("blocks after exceeding limit", () => {
    const request = buildRequest("127.0.0.2")
    enforceIpRateLimit(request, "test", { windowMs: 1000, limit: 1 })
    const result = enforceIpRateLimit(request, "test", { windowMs: 1000, limit: 1 })
    expect(result.allowed).toBe(false)
  })
})
