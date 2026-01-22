import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { upsertSeatalkSession } from "@/server/repositories/seatalk-sessions"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import { z } from "zod"

const seatalkSessionSchema = z
  .object({
    session_id: z.string({ required_error: "session_id is required" }).trim().min(1, "session_id is required"),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/seatalk/session", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-seatalk-session", {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  if (process.env.NEXT_PUBLIC_SEATALK_ENABLED === "false") {
    return NextResponse.json({ error: "Seatalk login is disabled" }, { status: 410 })
  }

  const parsed = await parseRequestJson(request, seatalkSessionSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const sessionId = parsed.data.session_id

  await upsertSeatalkSession(sessionId)

  return NextResponse.json({ success: true })
})
