import "server-only"
import { cookies } from "next/headers"
import { getRequestContext } from "@/lib/request-context"
import { createAuthSession, deleteAuthSession, getAuthSessionWithUser, updateAuthSessionLastSeen } from "@/server/repositories/auth-sessions"

export type SessionUser = {
  ops_id?: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin" | "Processor"
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

type CookieOptions = ReturnType<typeof cookieOptions>

export function getSessionIdFromCookies() {
  return cookies().get(SESSION_COOKIE_NAME)?.value || null
}

export async function createSession(opsId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)
  const result = await createAuthSession(opsId, expiresAt)

  return {
    sessionId: result.sessionId,
    expiresAt,
  }
}

export async function deleteSession(sessionId: string) {
  await deleteAuthSession(sessionId)
}

export async function getSession() {
  const sessionId = getSessionIdFromCookies()
  if (!sessionId) return null

  const session = await getAuthSessionWithUser(sessionId, new Date())
  if (!session) {
    return null
  }

  const now = Date.now()
  const lastSeen = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0

  const route = getRequestContext()?.route
  const isApiRequest = route ? route.startsWith("/api/") : false

  if (isApiRequest && (!lastSeen || now - lastSeen > SESSION_REFRESH_MINUTES * 60 * 1000)) {
    await updateAuthSessionLastSeen(session.sessionId, new Date())
  }

  return {
    sessionId: session.sessionId,
    user: {
      ops_id: session.user.opsId,
      name: session.user.name,
      role: session.user.role,
      email: session.user.email || undefined,
      department: session.user.department || undefined,
    },
  }
}

export function setSessionCookie(response: Response, sessionId: string) {
  const maxAge = Math.max(1, Math.floor(SESSION_TTL_HOURS * 60 * 60))
  const options = cookieOptions(maxAge)
  const cookieJar = (response as Response & { cookies?: { set: (name: string, value: string, options: CookieOptions) => void } }).cookies
  if (cookieJar?.set) {
    cookieJar.set(SESSION_COOKIE_NAME, sessionId, options)
  }
}

export function clearSessionCookie(response: Response) {
  const options = cookieOptions(0)
  const cookieJar = (response as Response & { cookies?: { set: (name: string, value: string, options: CookieOptions) => void } }).cookies
  if (cookieJar?.set) {
    cookieJar.set(SESSION_COOKIE_NAME, "", options)
  }
}
