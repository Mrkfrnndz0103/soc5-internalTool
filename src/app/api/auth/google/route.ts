import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { query } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
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

    const existing = await query(
      `SELECT ops_id, name, role, email, department
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "User not provisioned" }, { status: 403 })
    }

    const { sessionId } = await createSession(existing.rows[0].ops_id)
    const response = NextResponse.json({
      user: existing.rows[0],
    })
    setSessionCookie(response, sessionId)
    return response
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google login failed" }, { status: 401 })
  }
})
