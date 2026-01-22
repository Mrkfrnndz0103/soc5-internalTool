import { enforceSessionRateLimit } from "@/lib/rate-limit"
import {
  getSessionRateLimit,
  incrementSessionRateLimit,
  resetSessionRateLimit,
} from "@/server/repositories/session-rate-limits"

jest.mock("@/server/repositories/session-rate-limits", () => ({
  getSessionRateLimit: jest.fn(),
  resetSessionRateLimit: jest.fn(),
  incrementSessionRateLimit: jest.fn(),
}))

const mockedGetSessionRateLimit = jest.mocked(getSessionRateLimit)
const mockedResetSessionRateLimit = jest.mocked(resetSessionRateLimit)
const mockedIncrementSessionRateLimit = jest.mocked(incrementSessionRateLimit)

describe("enforceSessionRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("resets when no existing record", async () => {
    mockedGetSessionRateLimit.mockResolvedValueOnce(null)
    mockedResetSessionRateLimit.mockResolvedValueOnce()
    const result = await enforceSessionRateLimit("session-1", { windowMs: 1000, limit: 2 })
    expect(result.allowed).toBe(true)
    expect(mockedResetSessionRateLimit).toHaveBeenCalledTimes(1)
    expect(mockedIncrementSessionRateLimit).not.toHaveBeenCalled()
  })

  it("increments when within window", async () => {
    mockedGetSessionRateLimit.mockResolvedValueOnce({
      count: 1,
      expiresAt: new Date(Date.now() + 10000),
    })
    mockedIncrementSessionRateLimit.mockResolvedValueOnce({
      count: 2,
      expiresAt: new Date(Date.now() + 10000),
    })

    const result = await enforceSessionRateLimit("session-2", { windowMs: 1000, limit: 2 })
    expect(result.allowed).toBe(true)
    expect(mockedIncrementSessionRateLimit).toHaveBeenCalledTimes(1)
  })

  it("blocks when over limit", async () => {
    mockedGetSessionRateLimit.mockResolvedValueOnce({
      count: 2,
      expiresAt: new Date(Date.now() + 10000),
    })
    mockedIncrementSessionRateLimit.mockResolvedValueOnce({
      count: 3,
      expiresAt: new Date(Date.now() + 10000),
    })

    const result = await enforceSessionRateLimit("session-3", { windowMs: 1000, limit: 2 })
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })
})
