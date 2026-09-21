import type { Metadata } from 'next'
import { Cormorant_Garamond, Instrument_Sans, Space_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'

import '../globals.css'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { CartProvider } from '@/components/cart/cart-provider'
import { commerce } from '@/lib/commerce'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { about } from '@/lib/about'
import { getDictionary } from '@/lib/i18n'
import { isLocale, localeHtmlLang, locales, type Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

/* Autoalojadas por next/font: sin request bloqueante a Google y sin CLS al
   cambiar de fuente. El prototipo las cargaba por CDN. */
/* La serif de los títulos sigue al logo: contraste alto, remates finos y
   proporciones anchas. Cormorant tiene la altura de x baja, así que en cuerpos
   chicos se compensa con un peso mayor — ver `--font-display` en globals.css. */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  // Los únicos dos que usa el sitio: 500 en casi todos los títulos, 400 suelto.
  weight: ['400', '500'],
  variable: '--font-cormorant',
  display: 'swap',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale)

  return {
    metadataBase: new URL(site.url),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((item) => [localeHtmlLang[item], `/${item}`]),
      ),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      type: 'website',
      locale: localeHtmlLang[locale],
      siteName: 'Ruralanas',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const dict = getDictionary(locale)
  const aboutLinks = (await about.listSections(locale)).map((section) => ({
    href: routes.about(locale, section.slug),
    label: section.eyebrow,
  }))

  return (
    <html
      lang={localeHtmlLang[locale]}
      className={`${cormorant.variable} ${instrument.variable} ${spaceMono.variable}`}
    >
      <body>
        {/* Sin JavaScript los bloques con reveal deben verse igual. */}
        <noscript>
          <style>{`[data-reveal="hidden"]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>

        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-earth"
        >
          {dict.nav.skipToContent}
        </a>

        <CartProvider locale={locale} mode={commerce.kind}>
          <SiteHeader locale={locale} dict={dict} />
          <main id="contenido">{children}</main>
          <SiteFooter locale={locale} dict={dict} aboutLinks={aboutLinks} />
          <CartDrawer locale={locale} dict={dict} />
        </CartProvider>
      </body>
    </html>
  )
}
