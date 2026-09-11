import 'server-only'

/**
 * Sesión del admin de reseñas.
 *
 * Es una puerta simple a propósito: lo único que hay del otro lado es cargar
 * una reseña. Una contraseña compartida en el entorno, comparada en tiempo
 * constante, y una cookie `httpOnly` firmada con esa misma contraseña — así
 * cambiarla invalida todas las sesiones abiertas, que es el comportamiento
 * que uno espera.
 *
 * Lo que esto **no** es: un sistema de usuarios. Si algún día el admin hace
 * algo más que cargar reseñas, esto se reemplaza por autenticación de verdad,
 * probablemente contra las cuentas de WordPress.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'ruralanas_admin'
const TTL_MS = 12 * 60 * 60 * 1000

function secret(): string | null {
  const password = process.env.ADMIN_PASSWORD
  return password && password.length >= 12 ? password : null
}

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
  const expires = String(Date.now() + TTL_MS)
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
