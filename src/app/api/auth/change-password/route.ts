import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { AUTH_RATE_LIMIT_MAX_REQUESTS, AUTH_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import { z } from "zod"

const changePasswordSchema = z
  .object({
    ops_id: z.string({ required_error: "ops_id is required" }).trim().min(1, "ops_id is required"),
    old_password: z.string().optional(),
    new_password: z.string().optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/change-password", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "auth-change-password", {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: AUTH_RATE_LIMIT_MAX_REQUESTS,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const parsed = await parseRequestJson(request, changePasswordSchema)
  if (parsed.errorResponse) return parsed.errorResponse

  return NextResponse.json(
    { error: "Password login is disabled. Use Google Sign-In or Seatalk." },
    { status: 410 }
  )
})
