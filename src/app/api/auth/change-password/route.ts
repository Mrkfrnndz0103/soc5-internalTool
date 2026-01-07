import { NextResponse } from "next/server"
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const opsId = body?.ops_id

  if (!opsId) {
    return NextResponse.json({ error: "ops_id is required" }, { status: 400 })
  }

  return NextResponse.json(
    { error: "Password login is disabled. Use Google Sign-In or Seatalk." },
    { status: 410 }
  )
}
