import { NextResponse } from "next/server"
import { createSession, setSessionCookie } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { getActiveAuthSession } from "@/server/repositories/auth-sessions"
import { getAuthenticatedSeatalkSession, linkSeatalkAuthSession } from "@/server/repositories/seatalk-sessions"
import { getUserByEmail } from "@/server/repositories/users"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import { z } from "zod"

const seatalkLoginSchema = z
  .object({
    session_id: z.string({ required_error: "session_id is required" }).trim().min(1, "session_id is required"),
  })
  .strict()

const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "shopeemobile-external.com,spxexpress.com")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean)

function isAllowedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || ""
  return domain && allowedDomains.includes(domain)
}

export const POST = withRequestLogging("/api/auth/seatalk/login", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-seatalk-login", {
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

  const parsed = await parseRequestJson(request, seatalkLoginSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const seatalkSessionId = parsed.data.session_id

  const seatalkSession = await getAuthenticatedSeatalkSession(seatalkSessionId)
  if (!seatalkSession) {
    return NextResponse.json({ error: "Seatalk session not authenticated" }, { status: 401 })
  }

  const email = seatalkSession.email
  if (!email) {
    return NextResponse.json({ error: "Seatalk email is missing" }, { status: 401 })
  }

  if (!isAllowedDomain(email)) {
    return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: "User not provisioned" }, { status: 403 })
  }

  let sessionId = seatalkSession.authSessionId
  if (sessionId) {
    const existingSession = await getActiveAuthSession(sessionId, new Date())
    if (!existingSession) {
      sessionId = null
    }
  }

  if (!sessionId) {
    const created = await createSession(user.opsId)
    sessionId = created.sessionId
    await linkSeatalkAuthSession(seatalkSessionId, sessionId)
  }

  const response = NextResponse.json({
    user: {
      ops_id: user.opsId,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
    },
  })
  setSessionCookie(response, sessionId)
  return response
})
