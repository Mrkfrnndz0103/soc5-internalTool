import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const opsId = params.id
  const result = await query(
    `SELECT ops_id, name, role, email, department
     FROM users
     WHERE ops_id = $1
     LIMIT 1`,
    [opsId]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(result.rows[0])
}
