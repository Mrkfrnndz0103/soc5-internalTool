import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { query } from "@/lib/db"

const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "shopeemobile-external.com,spxexpress.com")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean)

function isAllowedDomain(value: string) {
  const domain = value.split("@")[1]?.toLowerCase() || ""
  return domain && allowedDomains.includes(domain)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const opsId = body?.ops_id

  if (!opsId) {
    return NextResponse.json({ error: "ops_id is required" }, { status: 400 })
  }

  if (opsId.includes("@") && !isAllowedDomain(opsId)) {
    return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
  }

  const result = await query(
    `SELECT ops_id, name, role, email
     FROM users
     WHERE ops_id = $1 OR email = $1
     LIMIT 1`,
    [opsId]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const user = result.rows[0]

  if (user.email && !isAllowedDomain(user.email)) {
    return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
  }

  const token = randomUUID()

  return NextResponse.json({
    user: {
      ops_id: user.ops_id,
      name: user.name,
      role: user.role,
      email: user.email,
    },
    token,
  })
}
