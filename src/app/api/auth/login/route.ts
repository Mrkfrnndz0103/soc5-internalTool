import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import { z } from "zod"

const loginSchema = z
  .object({
    ops_id: z.string().trim().min(1).optional(),
    password: z.string().optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/login", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-login", {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const parsed = await parseRequestJson(request, loginSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  return NextResponse.json(
    { error: "Direct ops_id login is disabled. Use Google Sign-In or SeaTalk." },
    { status: 410 }
  )
})
