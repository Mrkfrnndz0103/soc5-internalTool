import "server-only"
import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { getRequestContext } from "@/lib/request-context"

export type SessionUser = {
  ops_id?: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin"
  email?: string
  department?: string
}

const SESSION_COOKIE_NAME = "soc5_session"
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || "12") || 12
const SESSION_REFRESH_MINUTES = Number(process.env.SESSION_REFRESH_MINUTES || "10") || 10

function isSecureCookie() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true"
  return process.env.NODE_ENV === "production"
}

function getCookieDomain() {
  const domain = process.env.COOKIE_DOMAIN
  return domain && domain !== "localhost" ? domain : undefined
}

function cookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax" as const,
    path: "/",
    domain: getCookieDomain(),
    maxAge: maxAgeSeconds,
  }
}

export function getSessionIdFromCookies() {
  return cookies().get(SESSION_COOKIE_NAME)?.value || null
}

export async function createSession(opsId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)
  const result = await query<{ session_id: string }>(
    `INSERT INTO auth_sessions (ops_id, expires_at)
     VALUES ($1, $2)
     RETURNING session_id`,
    [opsId, expiresAt]
  )

  return {
    sessionId: result.rows[0].session_id,
    expiresAt,
  }
}

export async function deleteSession(sessionId: string) {
  await query("DELETE FROM auth_sessions WHERE session_id = $1", [sessionId])
}

export async function getSession() {
  const sessionId = getSessionIdFromCookies()
  if (!sessionId) return null

  const result = await query<{
    session_id: string
    expires_at: Date
    last_seen_at: Date | null
    ops_id: string
    name: string
    role: SessionUser["role"]
    email: string | null
    department: string | null
  }>(
    `SELECT s.session_id,
            s.expires_at,
            s.last_seen_at,
            u.ops_id,
            u.name,
            u.role,
            u.email,
            u.department
     FROM auth_sessions s
     JOIN users u ON u.ops_id = s.ops_id
     WHERE s.session_id = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [sessionId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  const now = Date.now()
  const lastSeen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0

  const route = getRequestContext()?.route
  const isApiRequest = route ? route.startsWith("/api/") : false

  if (isApiRequest && (!lastSeen || now - lastSeen > SESSION_REFRESH_MINUTES * 60 * 1000)) {
    await query("UPDATE auth_sessions SET last_seen_at = NOW() WHERE session_id = $1", [row.session_id])
  }

  return {
    sessionId: row.session_id,
    user: {
      ops_id: row.ops_id,
      name: row.name,
      role: row.role,
      email: row.email || undefined,
      department: row.department || undefined,
    },
  }
}

export function setSessionCookie(response: Response, sessionId: string) {
  const maxAge = Math.max(1, Math.floor(SESSION_TTL_HOURS * 60 * 60))
  const options = cookieOptions(maxAge)
  const cookieJar = (response as any).cookies
  if (cookieJar?.set) {
    cookieJar.set(SESSION_COOKIE_NAME, sessionId, options)
  }
}

export function clearSessionCookie(response: Response) {
  const options = cookieOptions(0)
  const cookieJar = (response as any).cookies
  if (cookieJar?.set) {
    cookieJar.set(SESSION_COOKIE_NAME, "", options)
  }
}
