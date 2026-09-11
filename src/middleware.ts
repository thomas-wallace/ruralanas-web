import { NextResponse, type NextRequest } from 'next/server'
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return NextResponse.next()

  const locale = negotiate(request.headers.get('accept-language'))
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // Todo salvo API, estáticos de Next y archivos con extensión.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
