import { NextResponse } from "next/server"
import { clearSessionCookie, deleteSession, getSession, getSessionIdFromCookies } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const logoutSchema = z.object({}).strict()

export const POST = withRequestLogging("/api/auth/logout", async (request: Request) => {
  const parsed = await parseRequestJson(request, logoutSchema)
  if (parsed.errorResponse) return parsed.errorResponse

  const session = await getSession()
  if (session) {
    const rateLimit = await enforceSessionRateLimit(session.sessionId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }
  }
  const sessionId = getSessionIdFromCookies()
  if (sessionId) {
    await deleteSession(sessionId)
  }

  const response = NextResponse.json({ success: true })
  clearSessionCookie(response)
  return response
})
