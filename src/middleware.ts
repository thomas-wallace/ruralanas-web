import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin/token'
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

// ── Admin ────────────────────────────────────────────────────────────────────
//
// Primera capa de la puerta del admin (ver `src/lib/admin/session.ts`). Sin
// sesión válida no se ve ninguna página del admin —se va a la de ingreso antes
// de dibujar nada— ni responde ninguna de sus APIs.

const ADMIN_PAGE = new RegExp(`^/(${locales.join('|')})/admin(?:/|$)`)
const ADMIN_LOGIN = new RegExp(`^/(${locales.join('|')})/admin/ingresar/?$`)
/** La única API del admin abierta sin sesión: la que permite entrar. */
const ADMIN_SESSION_API = '/api/admin/session'

/** Nada del admin se guarda en cachés, se indexa ni se muestra dentro de otro sitio. */
function adminHeaders(response: NextResponse): NextResponse {
  response.headers.set('cache-control', 'no-store, max-age=0')
  response.headers.set('x-robots-tag', 'noindex, nofollow')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'same-origin')
  return response
}

/**
 * Una escritura sólo vale si la pide una página de este mismo sitio. Junto con
 * la cookie `SameSite=Strict`, cierra la puerta a que otro sitio haga que el
 * navegador de alguien con sesión cambie algo sin saberlo (CSRF).
 */
function sameOrigin(request: NextRequest): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return true
  return request.headers.get('origin') === request.nextUrl.origin
}

async function guardAdmin(request: NextRequest): Promise<NextResponse | null> {
  const { pathname, search } = request.nextUrl
  const isApi = pathname.startsWith('/api/admin/')
  const isPage = ADMIN_PAGE.test(pathname)
  if (!isApi && !isPage) return null

  if (isApi && !sameOrigin(request)) {
    return adminHeaders(NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 }))
  }

  const signedIn = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)

  if (isApi) {
    if (!signedIn && pathname !== ADMIN_SESSION_API) {
      return adminHeaders(NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 }))
    }
    return adminHeaders(NextResponse.next())
  }

  const locale = ADMIN_PAGE.exec(pathname)?.[1] ?? defaultLocale
  const login = ADMIN_LOGIN.test(pathname)

  if (!signedIn && !login) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/admin/ingresar`
    url.search = ''
    url.searchParams.set('volver', `${pathname}${search}`)
    return adminHeaders(NextResponse.redirect(url))
  }
  if (signedIn && login) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/admin`
    url.search = ''
    return adminHeaders(NextResponse.redirect(url))
  }
  return adminHeaders(NextResponse.next())
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const admin = await guardAdmin(request)
  if (admin) return admin

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
  // Todo salvo API (menos las del admin), estáticos de Next y archivos con
  // extensión. Más las rutas de WordPress con extensión (`.php`, `.css`, `.js`),
  // que sólo pasan por acá en la copia de prueba; en producción las atiende el
  // servidor de WordPress.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Las APIs del admin también pasan por la puerta.
    '/api/admin/:path*',
    '/wp-admin/:path*',
    '/wp-content/:path*',
    '/wp-includes/:path*',
    '/wp-login.php',
  ],
}
