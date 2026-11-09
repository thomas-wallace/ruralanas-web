/**
 * Token de sesión del admin: `{vence}.{firma}`, con la firma HMAC-SHA256 del
 * vencimiento usando `ADMIN_PASSWORD` como clave. Cambiar la contraseña invalida
 * todas las sesiones abiertas.
 *
 * Este archivo no usa `node:crypto` sino Web Crypto, para poder verificar la
 * sesión en el middleware (que puede correr fuera de Node). La emisión sigue en
 * `session.ts`; las dos firman igual.
 */

/**
 * En producción el nombre lleva el prefijo `__Host-`: el navegador sólo acepta
 * esa cookie si es `Secure`, de este mismo dominio exacto y de ruta `/`. Ningún
 * subdominio puede pisarla.
 */
export const ADMIN_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Host-ruralanas_admin' : 'ruralanas_admin'

/** Una jornada de trabajo. Después hay que volver a entrar. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000

/** La contraseña sólo cuenta si está configurada y tiene al menos 12 caracteres. */
export function adminSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD
  return password && password.length >= 12 ? password : null
}

function base64url(bytes: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Comparación en tiempo constante: no revela cuántos caracteres coinciden. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  const secret = adminSecret()
  if (!token || !secret) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) <= Date.now()) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const expected = base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(expires)))
  return sameText(signature, expected)
}
