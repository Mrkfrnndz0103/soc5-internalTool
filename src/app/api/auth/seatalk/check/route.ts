import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { getAuthenticatedSeatalkSession } from "@/server/repositories/seatalk-sessions"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"

export const GET = withRequestLogging("/api/auth/seatalk/check", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-seatalk-check", {
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

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const session = await getAuthenticatedSeatalkSession(sessionId)
  if (!session) {
    return NextResponse.json(null)
  }

  return NextResponse.json({
    email: session.email,
    authenticated: session.authenticated,
  })
})
