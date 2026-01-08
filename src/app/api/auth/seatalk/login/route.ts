import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
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
  if (process.env.NEXT_PUBLIC_SEATALK_ENABLED === "false") {
    return NextResponse.json({ error: "Seatalk login is disabled" }, { status: 410 })
  }

  const parsed = await parseRequestJson(request, seatalkLoginSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const seatalkSessionId = parsed.data.session_id

  const seatalkResult = await query<{
    session_id: string
    email: string | null
    authenticated: boolean
    auth_session_id: string | null
  }>(
    `SELECT session_id, email, authenticated, auth_session_id
     FROM seatalk_sessions
     WHERE session_id = $1 AND authenticated = true
     LIMIT 1`,
    [seatalkSessionId]
  )

  if (seatalkResult.rows.length === 0) {
    return NextResponse.json({ error: "Seatalk session not authenticated" }, { status: 401 })
  }

  const email = seatalkResult.rows[0].email
  if (!email) {
    return NextResponse.json({ error: "Seatalk email is missing" }, { status: 401 })
  }

  if (!isAllowedDomain(email)) {
    return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
  }

  const userResult = await query(
    `SELECT ops_id, name, role, email, department
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  )

  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "User not provisioned" }, { status: 403 })
  }

  let sessionId = seatalkResult.rows[0].auth_session_id
  if (sessionId) {
    const existingSession = await query(
      `SELECT session_id
       FROM auth_sessions
       WHERE session_id = $1 AND expires_at > NOW()
       LIMIT 1`,
      [sessionId]
    )
    if (existingSession.rows.length === 0) {
      sessionId = null
    }
  }

  if (!sessionId) {
    const created = await createSession(userResult.rows[0].ops_id)
    sessionId = created.sessionId
    await query(
      `UPDATE seatalk_sessions
       SET auth_session_id = $1
       WHERE session_id = $2`,
      [sessionId, seatalkSessionId]
    )
  }

  const response = NextResponse.json({ user: userResult.rows[0] })
  setSessionCookie(response, sessionId)
  return response
})
