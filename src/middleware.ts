import { NextResponse, type NextRequest } from 'next/server'
import { CURRENCY_COOKIE, currencyForCountry, isDisplayCurrency } from '@/lib/currency/config'
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config'
import { TRANSLATED_IN_WORDPRESS } from '@/lib/i18n/translatepress'

/** Primer idioma soportado que pida el navegador; si ninguno, español. */
function negotiate(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale

  const requested = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', q = 'q=1'] = part.trim().split(';')
      return { tag: tag.toLowerCase(), q: Number.parseFloat(q.replace('q=', '')) || 0 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of requested) {
    const match = locales.find((locale) => tag === locale || tag.startsWith(`${locale}-`))
    if (match) return match
  }

  return defaultLocale
}

/**
 * País del visitante según la plataforma donde corra el sitio. Cada una lo
 * pone en un encabezado distinto; en local no hay ninguno y queda en dólares.
 */
function countryOf(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    request.headers.get('cloudfront-viewer-country') ??
    null
  )
}

/**
 * La primera visita fija la moneda por país. Después manda la cookie: si el
 * cliente eligió otra en el selector, no se le cambia por viajar.
 */
function withCurrency(request: NextRequest, response: NextResponse): NextResponse {
  if (isDisplayCurrency(request.cookies.get(CURRENCY_COOKIE)?.value)) return response
  response.cookies.set(CURRENCY_COOKIE, currencyForCountry(countryOf(request)), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}

/**
 * Rutas que son de WordPress y no de la tienda: carrito, checkout y cuenta de
 * Woo, el panel, sus archivos y las llamadas AJAX de WooCommerce y de las
 * pasarelas de pago (`?wc-ajax=` y `?wc-api=`).
 */
const WORDPRESS_PREFIXES = [
  '/cart',
  '/checkout/',
  '/my-account',
  '/wp-admin',
  '/wp-content/',
  '/wp-includes/',
  '/wp-json/',
  '/wp-login.php',
  '/wc-api/',
  // Las mismas páginas en los idiomas que traduce TranslatePress (`/en/checkout/`).
  // `/en/checkout` sin barra es la página propia de la tienda; con barra, la de Woo.
  ...[...TRANSLATED_IN_WORDPRESS].flatMap((locale) => [
    `/${locale}/cart`,
    `/${locale}/checkout/`,
    `/${locale}/my-account`,
  ]),
]

function isWordPressRequest({ pathname, searchParams }: NextRequest['nextUrl']): boolean {
  if (searchParams.has('wc-ajax') || searchParams.has('wc-api')) return true
  // `/checkout` sin barra no existe en la tienda; `/checkout/…` es el de Woo.
  return WORDPRESS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Copia de prueba (staging/README.md): la tienda atiende el origen entero y le
  // pasa a WordPress lo que es suyo, así el carrito llega al checkout con la
  // misma cookie. Sin `WP_PROXY_ORIGIN` —producción hoy— esto no existe.
  const wordpress = process.env.WP_PROXY_ORIGIN
  if (wordpress && isWordPressRequest(request.nextUrl)) {
    return NextResponse.rewrite(new URL(`${pathname}${request.nextUrl.search}`, wordpress))
  }

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return withCurrency(request, NextResponse.next())

  const locale = negotiate(request.headers.get('accept-language'))
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return withCurrency(request, NextResponse.redirect(url))
}

export const config = {
  // Todo salvo API, estáticos de Next y archivos con extensión. Más las rutas
  // de WordPress con extensión (`.php`, `.css`, `.js`), que sólo pasan por acá
  // en la copia de prueba; en producción las atiende el servidor de WordPress.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/wp-admin/:path*',
    '/wp-content/:path*',
    '/wp-includes/:path*',
    '/wp-login.php',
  ],
}
