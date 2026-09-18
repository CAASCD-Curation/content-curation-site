const SESSION_COOKIE = 'cc_admin_session'
const SESSION_TTL_SECONDS = 8 * 60 * 60
const STUDENT_SESSION_COOKIE = 'cc_student_session'
const STUDENT_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
const PBKDF2_ITERATIONS = 100000

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function error(message, status = 400, details = undefined) {
  return json({ error: message, ...(details ? { details } : {}) }, status)
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || ''
  const pair = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : ''
}

export function sessionCookie(token, maxAge = SESSION_TTL_SECONDS, name = SESSION_COOKIE) {
  return `${name}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export function clearedSessionCookie(name = SESSION_COOKIE) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export const studentSessionCookie = (token) => sessionCookie(token, STUDENT_SESSION_TTL_SECONDS, STUDENT_SESSION_COOKIE)
export const clearedStudentSessionCookie = () => clearedSessionCookie(STUDENT_SESSION_COOKIE)

export async function digestHex(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export async function hashStudentPassword(password, pepper) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${password}${pepper}`),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`
}

export async function verifyStudentPassword(password, encoded, pepper) {
  try {
    const [algorithm, iterationText, saltText, digestText] = String(encoded || '').split('$')
    const iterations = Number(iterationText)
    if (algorithm !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || iterations < 1 || !saltText || !digestText) return false
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(`${password}${pepper}`),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    )
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: base64ToBytes(saltText), iterations, hash: 'SHA-256' },
      key,
      256,
    )
    return bytesToBase64(new Uint8Array(bits)) === digestText
  } catch {
    return false
  }
}

export function normalizeStudentNumber(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function initialStudentPassword(username) {
  return username.slice(-6)
}

export function isValidStudentNumber(username) {
  return /^[a-z0-9_-]{1,32}$/.test(username)
}

export function isValidNewPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 64
}

export function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomInviteCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('')
}

export async function requireAdmin(request, env) {
  if (!env.DB) return { response: error('D1 数据库尚未绑定', 503) }
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return { response: error('需要教师登录', 401) }
  const tokenHash = await digestHex(token)
  const session = await env.DB.prepare(
    `SELECT id FROM sessions WHERE token_hash = ? AND kind = 'admin' AND expires_at > datetime('now')`,
  ).bind(tokenHash).first()
  if (!session) return { response: error('教师会话已过期，请重新登录', 401) }
  return { session }
}

export async function getOptionalAdmin(request, env) {
  if (!env.DB) return null
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await digestHex(token)
  const session = await env.DB.prepare(
    `SELECT id FROM sessions WHERE token_hash = ? AND kind = 'admin' AND expires_at > datetime('now')`,
  ).bind(tokenHash).first()
  return session || null
}

export async function requireStudent(request, env, { allowPasswordChange = true } = {}) {
  if (!env.DB) return { response: error('D1 数据库尚未绑定', 503) }
  const token = getCookie(request, STUDENT_SESSION_COOKIE)
  if (!token) return { response: error('需要学生登录', 401) }
  const tokenHash = await digestHex(token)
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.display_name AS displayName, u.class_name AS className, u.role, u.status,
           u.must_change_password AS mustChangePassword, s.id AS sessionId
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.kind = 'student' AND s.expires_at > datetime('now')
  `).bind(tokenHash).first()
  if (!user || user.role !== 'student') return { response: error('学生会话已过期，请重新登录', 401) }
  if (user.status !== 'active') return { response: error('学生账号已停用', 403) }
  if (!allowPasswordChange && Number(user.mustChangePassword) === 1) {
    return { response: error('请先修改初始密码', 403, { code: 'PASSWORD_CHANGE_REQUIRED' }) }
  }
  return { user, token, tokenHash }
}

export async function getOptionalStudent(request, env) {
  if (!env.DB) return null
  const token = getCookie(request, STUDENT_SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await digestHex(token)
  return env.DB.prepare(`
    SELECT u.id, u.username, u.display_name AS displayName
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.kind = 'student'
      AND s.expires_at > datetime('now')
      AND u.role = 'student'
      AND u.status = 'active'
  `).bind(tokenHash).first()
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function assertSameOrigin(request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  return origin === new URL(request.url).origin
}

export { SESSION_TTL_SECONDS, STUDENT_SESSION_TTL_SECONDS }
