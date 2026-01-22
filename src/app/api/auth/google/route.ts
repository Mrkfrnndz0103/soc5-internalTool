import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { createSession, setSessionCookie } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { getUserByEmail } from "@/server/repositories/users"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import { z } from "zod"

const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "shopeemobile-external.com,spxexpress.com")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean)

function isAllowedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || ""
  return domain && allowedDomains.includes(domain)
}

const googleAuthSchema = z
  .object({
    id_token: z.string({ required_error: "id_token is required" }).trim().min(1, "id_token is required"),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/google", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-google", {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const parsed = await parseRequestJson(request, googleAuthSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const idToken = parsed.data.id_token

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google client ID is not configured" }, { status: 500 })
  }

  const client = new OAuth2Client(clientId)

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId })
    const payload = ticket.getPayload()
    const email = payload?.email

    if (!email || !payload?.email_verified) {
      return NextResponse.json({ error: "Google email is not verified" }, { status: 401 })
    }

    if (!isAllowedDomain(email)) {
      return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
    }

    const existing = await getUserByEmail(email)
    if (!existing) {
      return NextResponse.json({ error: "User not provisioned" }, { status: 403 })
    }

    const { sessionId } = await createSession(existing.opsId)
    const response = NextResponse.json({
      user: {
        ops_id: existing.opsId,
        name: existing.name,
        role: existing.role,
        email: existing.email,
        department: existing.department,
      },
    })
    setSessionCookie(response, sessionId)
    return response
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google login failed" }, { status: 401 })
  }
})
