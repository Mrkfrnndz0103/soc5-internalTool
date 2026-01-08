import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { withRequestLogging } from "@/lib/request-context"

export const POST = withRequestLogging("/api/auth/seatalk/session", async (request: Request) => {
  if (process.env.NEXT_PUBLIC_SEATALK_ENABLED === "false") {
    return NextResponse.json({ error: "Seatalk login is disabled" }, { status: 410 })
  }

  const body = await request.json().catch(() => ({}))
  const sessionId = body?.session_id

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  await query(
    `INSERT INTO seatalk_sessions (session_id, authenticated)
     VALUES ($1, false)
     ON CONFLICT (session_id)
     DO UPDATE SET authenticated = false`,
    [sessionId]
  )

  return NextResponse.json({ success: true })
})
