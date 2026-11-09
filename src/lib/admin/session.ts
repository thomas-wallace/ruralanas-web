import 'server-only'

/**
 * Sesión del admin.
 *
 * Una contraseña compartida en el entorno (`ADMIN_PASSWORD`), comparada en
 * tiempo constante, y una cookie `httpOnly`, `SameSite=Strict` y, en
 * producción, `Secure` con prefijo `__Host-`, firmada con esa misma contraseña:
 * cambiarla invalida todas las sesiones abiertas.
 *
 * Tres capas, de afuera hacia adentro:
 *   1. El middleware (`src/middleware.ts`) no deja ver ninguna página del
 *      admin ni llamar a `/api/admin/*` sin sesión, y rechaza las escrituras
 *      que no vengan de este mismo sitio (CSRF).
 *   2. El layout de las páginas del admin vuelve a verificar en el servidor.
 *   3. Cada ruta de `/api/admin/*` verifica con `isAdmin()`.
 *
 * Lo que esto **no** es: un sistema de usuarios. Una sola contraseña compartida
 * no dice quién cambió qué. El paso siguiente es entrar con cuentas
 * individuales, contra las de WordPress, con registro de cambios.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

import { ADMIN_COOKIE, adminSecret, SESSION_TTL_MS } from './token'

export { ADMIN_COOKIE, SESSION_TTL_MS }

const secret = adminSecret

/** `true` sólo si el admin está configurado con una contraseña usable. */
export function adminEnabled(): boolean {
  return secret() !== null
}

function sign(payload: string): string {
  return createHmac('sha256', secret() ?? '').update(payload).digest('base64url')
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function checkPassword(candidate: unknown): boolean {
  const password = secret()
  if (!password || typeof candidate !== 'string') return false
  return equal(candidate, password)
}

export function issueToken(): string {
  const expires = String(Date.now() + SESSION_TTL_MS)
  return `${expires}.${sign(expires)}`
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token || !secret()) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature) return false
  if (!equal(signature, sign(expires))) return false
  return Number(expires) > Date.now()
}

export function isAdmin(request: Request): boolean {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1)

  return tokenIsValid(token ? decodeURIComponent(token) : undefined)
}

/**
 * Freno de fuerza bruta. En memoria del proceso: alcanza para que probar
 * contraseñas a mano sea inviable, y no pretende más que eso.
 */
const attempts = new Map<string, { count: number; until: number }>()

export function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key)
  if (!entry) return false
  if (entry.until < Date.now()) {
    attempts.delete(key)
    return false
  }
  return entry.count >= 8
}

export function recordFailure(key: string): void {
  const entry = attempts.get(key)
  const until = Date.now() + 15 * 60 * 1000
  attempts.set(key, { count: (entry?.count ?? 0) + 1, until })
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}
