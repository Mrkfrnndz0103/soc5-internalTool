import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const seatalkSessionSchema = z
  .object({
    session_id: z.string({ required_error: "session_id is required" }).trim().min(1, "session_id is required"),
  })
  .strict()

export const POST = withRequestLogging("/api/auth/seatalk/session", async (request: Request) => {
  if (process.env.NEXT_PUBLIC_SEATALK_ENABLED === "false") {
    return NextResponse.json({ error: "Seatalk login is disabled" }, { status: 410 })
  }

  const parsed = await parseRequestJson(request, seatalkSessionSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const sessionId = parsed.data.session_id

  await query(
    `INSERT INTO seatalk_sessions (session_id, authenticated)
     VALUES ($1, false)
     ON CONFLICT (session_id)
     DO UPDATE SET authenticated = false, email = NULL, auth_session_id = NULL`,
    [sessionId]
  )

  return NextResponse.json({ success: true })
})
