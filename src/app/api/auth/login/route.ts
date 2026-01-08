import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const loginSchema = z
  .object({
    ops_id: z.string().trim().min(1).optional(),
    password: z.string().optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/login", async (request: Request) => {
  const parsed = await parseRequestJson(request, loginSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  return NextResponse.json(
    { error: "Direct ops_id login is disabled. Use Google Sign-In or SeaTalk." },
    { status: 410 }
  )
})
