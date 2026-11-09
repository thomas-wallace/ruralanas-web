/**
 * Entrar y salir del admin. La pantalla de ingreso es `/[locale]/admin/ingresar`.
 *
 * `GET`    dice si hay sesión y si el admin siquiera está configurado.
 * `POST`   valida la contraseña y deja la cookie.
 * `DELETE` cierra la sesión.
 */

import { NextResponse } from 'next/server'

import {
  ADMIN_COOKIE,
  adminEnabled,
  checkPassword,
  clearAttempts,
  isAdmin,
  issueToken,
  recordFailure,
  SESSION_TTL_MS,
  tooManyAttempts,
} from '@/lib/admin/session'

/** Atributos de la cookie. `__Host-` exige `Secure` y ruta `/`, también al borrarla. */
const COOKIE = {
  name: ADMIN_COOKIE,
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return NextResponse.json({ enabled: adminEnabled(), authenticated: isAdmin(request) })
}

export async function POST(request: Request) {
  if (!adminEnabled()) {
    return NextResponse.json(
      {
        error:
          'El admin no está configurado. Falta ADMIN_PASSWORD en el entorno (mínimo 12 caracteres).',
      },
      { status: 503 },
    )
  }

  // Sin cabecera de proxy, todas las visitas comparten cubeta. Es más
  // restrictivo de lo necesario, no menos, y para esta puerta está bien.
  const key = request.headers.get('x-forwarded-for') ?? 'local'
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Probá de nuevo en quince minutos.' },
      { status: 429 },
    )
  }

  let password: unknown
  try {
    ;({ password } = (await request.json()) as { password?: unknown })
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  if (!checkPassword(password)) {
    recordFailure(key)
    return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
  }

  clearAttempts(key)
  const response = NextResponse.json({ authenticated: true })
  response.cookies.set({ ...COOKIE, value: issueToken(), maxAge: SESSION_TTL_MS / 1000 })
  return response
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set({ ...COOKIE, value: '', maxAge: 0 })
  return response
}
