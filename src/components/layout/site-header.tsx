'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import { CurrencySwitch } from '@/components/currency/currency-switch'
import { BagIcon } from '@/components/ui/bag-icon'
import { IsotipoIcon } from '@/components/ui/isotipo-icon'
import type { Dictionary } from '@/lib/i18n'
import { locales, plannedLocales, type Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

export function SiteHeader({
  locale,
  dict,
  hasCampaigns,
}: {
  locale: Locale
  dict: Dictionary
  /** "Campañas" sólo entra al menú cuando hay alguna publicada. */
  hasCampaigns: boolean
}) {
  const pathname = usePathname()
  const { count, wishlist, ready, openDrawer } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  // Cerrar el menú al navegar.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const home = routes.home(locale)
  const isUnder = (href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`))

  const links = [
    { href: home, label: dict.nav.home, active: pathname === home },
    { href: routes.about(locale), label: dict.nav.about, active: isUnder(routes.about(locale)) },
    { href: routes.shop(locale), label: dict.nav.shop, active: isUnder(routes.shop(locale)) },
    ...(hasCampaigns
      ? [
          {
            href: routes.campaigns(locale),
            label: dict.nav.campaigns,
            active: isUnder(routes.campaigns(locale)),
          },
        ]
      : []),
    { href: routes.blog(locale), label: dict.nav.news, active: isUnder(routes.blog(locale)) },
  ]

  /** Mismo camino, otro idioma. */
  const switchTo = (target: string) => {
    if (!pathname) return `/${target}`
    const segments = pathname.split('/')
    segments[1] = target
    return segments.join('/') || `/${target}`
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-[60] border-b border-slate/20 bg-paper/80 backdrop-blur-lg">
      <div className="flex h-[var(--spacing-header)] items-center justify-between gap-6 px-[var(--spacing-gutter)]">
        <Link href={home} className="shrink-0" aria-label={site.name}>
          {/*
            El logo viene en su gris original, que no es un color de la paleta:
            es blanco y negro y así se usa. `priority` porque entra en el primer
            pantallazo y su carga tardía correría el resto del encabezado.
          */}
          <Image
            src="/logo-ruralanas.png"
            alt={site.name}
            width={1119}
            height={278}
            priority
            /*
              El huso es más alto que las letras: la palabra ocupa sólo el 41%
              del alto del archivo. Por eso 36px acá equivalen a los 22px de
              tipografía que había antes, y no 28. Después se agrandó dos veces un 20%.
            */
            className="h-[40px] w-auto sm:h-[52px]"
          />
        </Link>

        <div className="hidden items-center gap-12 text-sm lg:gap-20 tracking-[0.02em] md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={`transition-colors hover:text-earth ${
                link.active ? 'text-earth' : 'text-slate'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div
            className="hidden items-center gap-1.5 rounded-full border border-slate/35 px-2.5 py-1 font-sans text-xs text-slate md:flex"
            aria-label={dict.common.language}
          >
            {plannedLocales.map((item, index) => {
              const available = (locales as readonly string[]).includes(item)
              const current = item === locale
              return (
                <span key={item} className="flex items-center gap-1.5">
                  {index > 0 && <span className="opacity-40">·</span>}
                  {available ? (
                    <Link
                      href={switchTo(item)}
                      className={current ? 'text-earth' : 'text-slate hover:text-earth'}
                      hrefLang={item}
                    >
                      {item.toUpperCase()}
                    </Link>
                  ) : (
                    <span className="opacity-50" title="Próximamente">
                      {item.toUpperCase()}
                    </span>
                  )}
                </span>
              )
            })}
          </div>

          <CurrencySwitch
            label={dict.footer.currency}
            className="hidden gap-1.5 rounded-full border border-slate/35 px-2.5 py-1 font-sans text-xs md:flex"
          />

          <button
            type="button"
            aria-label={dict.nav.wishlist}
            className="relative cursor-pointer p-1 leading-none text-earth"
          >
            {/* Con algo guardado, el huso pasa a oliva: se nota sin contar. */}
            <IsotipoIcon size={22} className={ready && wishlist.length > 0 ? 'text-olive' : ''} />
            {ready && wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-earth px-1 font-sans text-[10px] text-paper">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={dict.nav.cart}
            aria-haspopup="dialog"
            className="relative cursor-pointer p-1 leading-none text-earth"
          >
            <BagIcon />
            {ready && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-caramel px-1 font-sans text-[10px] font-bold text-earth">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? dict.nav.close : dict.nav.menu}
            aria-expanded={menuOpen}
            className="cursor-pointer p-1.5 leading-none text-earth md:hidden"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <path d="M5 5l14 14" />
                  <path d="M19 5L5 19" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col border-t border-slate/20 bg-paper/97 py-2 backdrop-blur-lg md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-[var(--spacing-gutter)] py-4 text-base ${
                link.active ? 'text-earth' : 'text-slate'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-1.5 flex gap-4 border-t border-slate/20 px-[var(--spacing-gutter)] pb-2.5 pt-4 font-sans text-[13px] text-slate">
            {plannedLocales.map((item) => {
              const available = (locales as readonly string[]).includes(item)
              return available ? (
                <Link
                  key={item}
                  href={switchTo(item)}
                  hrefLang={item}
                  className={item === locale ? 'text-earth' : 'text-slate'}
                >
                  {item.toUpperCase()}
                </Link>
              ) : (
                <span key={item} className="opacity-50">
                  {item.toUpperCase()}
                </span>
              )
            })}
          </div>
          <CurrencySwitch
            label={dict.footer.currency}
            className="flex gap-1.5 px-[var(--spacing-gutter)] pb-2.5 pt-2 font-sans text-[13px]"
          />
        </div>
      )}
    </nav>
  )
}
