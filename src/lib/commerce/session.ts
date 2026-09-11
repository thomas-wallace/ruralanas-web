import 'server-only'

/**
 * Sesión de carrito del lado del servidor.
 *
 * El token vive en una cookie `httpOnly`: el navegador lo manda solo y ningún
 * script de terceros puede leerlo. Con Woo ese token es el `Cart-Token`, que
 * identifica un carrito real con precios y stock comprometidos; dejarlo en
 * `localStorage` sería regalarlo.
 */

import { NextResponse } from 'next/server'

import { isCommerceError } from './errors'
import type { CommerceContext } from './repository'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

export const CART_COOKIE = 'ruralanas_cart'
const MAX_AGE_DAYS = 30

/**
 * Cookies que pertenecen a WooCommerce y hay que reenviarle.
 *
 * Sólo las de sesión de carrito. Las de autenticación de WordPress no se
 * tocan: no hacen falta para comprar y reenviarlas convertiría a esta capa en
 * un puente de privilegios.
 */
const WOO_COOKIE = /^(wp_woocommerce_session_|woocommerce_)/

function wooCookiesFrom(header: string | null): string | undefined {
  if (!header) return undefined
  const relevant = header
    .split(';')
    .map((part) => part.trim())
    .filter((part) => WOO_COOKIE.test(part.split('=')[0] ?? ''))
  return relevant.length > 0 ? relevant.join('; ') : undefined
}

export function contextFrom(request: Request): CommerceContext {
  const url = new URL(request.url)
  const locale = url.searchParams.get('locale') ?? ''
  const header = request.headers.get('cookie')
  const own = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CART_COOKIE}=`))

  return {
    token: own ? decodeURIComponent(own.slice(CART_COOKIE.length + 1)) || null : null,
    locale: isLocale(locale) ? locale : defaultLocale,
    cookie: wooCookiesFrom(header),
  }
}

/**
 * Responde, persiste el token que devolvió el motor y traslada al navegador
 * las cookies de sesión de Woo.
 *
 * Ese traslado es lo que hace posible entregar el carrito a `/checkout/` sin
 * reconstruirlo: el navegador termina con la misma sesión de WooCommerce que
 * usó el servidor. Sólo surte efecto con storefront y Woo en el mismo origen.
 */
export function respondWith<T>(
  data: T,
  token: string | null,
  cookies?: string[],
): NextResponse {
  const response = NextResponse.json(data)
  for (const raw of cookies ?? []) response.headers.append('set-cookie', raw)
  if (token) {
    response.cookies.set({
      name: CART_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    })
  }
  return response
}

/**
 * Todo error de comercio sale con la misma forma: un `code` que la interfaz
 * puede traducir y un `message` que ya se puede mostrar. El `detail` técnico
 * se registra en el servidor y no viaja al navegador.
 */
export function respondWithError(error: unknown): NextResponse {
  if (isCommerceError(error)) {
    if (error.detail) console.error(`[commerce:${error.code}]`, error.detail)
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    )
  }

  console.error('[commerce:unhandled]', error)
  return NextResponse.json(
    { error: { code: 'upstream', message: 'No pudimos completar la operación.' } },
    { status: 500 },
  )
}
