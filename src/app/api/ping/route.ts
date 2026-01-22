import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"

export const GET = withRequestLogging("/api/ping", async () => {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
})
