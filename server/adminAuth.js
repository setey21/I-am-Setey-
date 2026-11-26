import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_SECONDS = 8 * 60 * 60

export function getAdminConfiguration() {
  const { ADMIN_PASSWORD, SESSION_SECRET } = process.env
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 20) {
    throw new Error('ADMIN_PASSWORD must be configured and at least 20 characters long.')
  }
  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be configured and at least 32 characters long.')
  }
  return { password: ADMIN_PASSWORD, secret: SESSION_SECRET }
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function signature(expiry, secret) {
  return createHmac('sha256', secret).update(expiry).digest('hex')
}

function cookieValue(req) {
  const cookieHeader = req.headers.cookie || ''
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : ''
}

function cookieAttributes(req, maxAge) {
  const secure = process.env.VERCEL_ENV === 'production'
    || req.headers['x-forwarded-proto'] === 'https'
  return `${COOKIE_NAME}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
}

export function createSessionCookie(req, secret) {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
  const value = `${expiry}.${signature(expiry, secret)}`
  const attributes = cookieAttributes(req, SESSION_TTL_SECONDS).replace(`${COOKIE_NAME}=;`, `${COOKIE_NAME}=${encodeURIComponent(value)};`)
  return attributes
}

export function clearSessionCookie(req) {
  return cookieAttributes(req, 0)
}

export function hasValidSession(req, secret) {
  const value = cookieValue(req)
  const [expiry, suppliedSignature, extra] = value.split('.')
  if (!expiry || !suppliedSignature || extra || !/^\d+$/.test(expiry)) return false
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false
  return safeEqual(suppliedSignature, signature(expiry, secret))
}

export function passwordMatches(candidate, expected) {
  return typeof candidate === 'string' && safeEqual(candidate, expected)
}

export function isSameOriginRequest(req) {
  const origin = req.headers.origin
  const host = req.headers.host
  if (!origin || !host) return false
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

export function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(status).json(payload)
}

export function isAuthorized(req) {
  try {
    const { secret } = getAdminConfiguration()
    return hasValidSession(req, secret)
  } catch {
    return false
  }
}
