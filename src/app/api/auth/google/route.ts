import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { query } from "@/lib/db"

const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "shopeemobile-external.com,spxexpress.com")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean)

function isAllowedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || ""
  return domain && allowedDomains.includes(domain)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const idToken = body?.id_token

  if (!idToken) {
    return NextResponse.json({ error: "id_token is required" }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Google client ID is not configured" }, { status: 500 })
  }

  const client = new OAuth2Client(clientId)

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId })
    const payload = ticket.getPayload()
    const email = payload?.email

    if (!email || !payload?.email_verified) {
      return NextResponse.json({ error: "Google email is not verified" }, { status: 401 })
    }

    if (!isAllowedDomain(email)) {
      return NextResponse.json({ error: "Email domain is not allowed" }, { status: 403 })
    }

    const existing = await query(
      `SELECT ops_id, name, role, email, department
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({
        user: existing.rows[0],
        token: payload.sub,
      })
    }

    const name = payload?.name || email.split("@")[0]
    const opsId = email

    const created = await query(
      `INSERT INTO users (ops_id, name, role, is_fte, email)
       VALUES ($1, $2, 'FTE', true, $3)
       RETURNING ops_id, name, role, email, department`,
      [opsId, name, email]
    )

    return NextResponse.json({
      user: created.rows[0],
      token: payload.sub,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google login failed" }, { status: 401 })
  }
}
