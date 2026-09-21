'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import type { Dictionary } from '@/lib/i18n'
import { locales, plannedLocales, type Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.6-9.2-8.4C1.3 8.9 2.6 5.5 5.7 5.1 8 4.8 9.4 6.3 12 8.7c2.6-2.4 4-3.9 6.3-3.6 3.1.4 4.4 3.8 2.9 6.5C19 15.4 12 20 12 20z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
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
              tipografía que había antes, y no 28.
            */
            className="h-7 w-auto sm:h-9"
          />
        </Link>

        <div className="hidden items-center gap-8 text-sm tracking-[0.02em] md:flex">
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
            className="hidden items-center gap-1.5 rounded-full border border-slate/35 px-2.5 py-1 font-mono text-xs text-slate md:flex"
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

          <button
            type="button"
            aria-label={dict.nav.wishlist}
            className="relative cursor-pointer p-1 leading-none text-earth"
          >
            <HeartIcon filled={ready && wishlist.length > 0} />
            {ready && wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-earth px-1 font-mono text-[10px] text-paper">
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
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-caramel px-1 font-mono text-[10px] font-bold text-earth">
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
          <div className="mt-1.5 flex gap-4 border-t border-slate/20 px-[var(--spacing-gutter)] pb-2.5 pt-4 font-mono text-[13px] text-slate">
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
        </div>
      )}
    </nav>
  )
}
