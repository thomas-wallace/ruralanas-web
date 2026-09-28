import { NextResponse, type NextRequest } from 'next/server'
import { CURRENCY_COOKIE, currencyForCountry, isDisplayCurrency } from '@/lib/currency/config'
import { defaultLocale, locales, type Locale } from '@/lib/i18n/config'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  // Todo salvo API, estáticos de Next y archivos con extensión.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
