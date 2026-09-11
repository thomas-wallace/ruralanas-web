'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import type { Dictionary } from '@/lib/i18n'
import { locales, plannedLocales, type Locale } from '@/lib/i18n/config'

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

  const isShop = pathname?.includes('/tienda')
  const home = `/${locale}`

  const links = [
    { href: home, label: dict.nav.home, active: !isShop },
    { href: `${home}#nosotros`, label: dict.nav.about, active: false },
    { href: `${home}/tienda`, label: dict.nav.shop, active: Boolean(isShop) },
    { href: `${home}#noticias`, label: dict.nav.news, active: false },
  ]

  /** Mismo camino, otro idioma. */
  const switchTo = (target: string) => {
    if (!pathname) return `/${target}`
    const segments = pathname.split('/')
    segments[1] = target
    return segments.join('/') || `/${target}`
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-[60] border-b border-stone/20 bg-carbon/72 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-6 px-[var(--spacing-gutter)] py-4">
        <Link
          href={home}
          className="shrink-0 font-display text-[clamp(16px,4.4vw,22px)] font-semibold tracking-[0.14em] text-linen"
        >
          RURALANAS
        </Link>

        <div className="hidden items-center gap-8 text-sm tracking-[0.02em] md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`transition-colors hover:text-linen ${
                link.active ? 'text-linen' : 'text-stone'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div
            className="hidden items-center gap-1.5 rounded-full border border-stone/35 px-2.5 py-1 font-mono text-xs text-stone md:flex"
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
                      className={current ? 'text-linen' : 'text-stone hover:text-linen'}
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
            className="relative cursor-pointer p-1 leading-none text-linen"
          >
            <HeartIcon filled={ready && wishlist.length > 0} />
            {ready && wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-merlot px-1 font-mono text-[10px] text-linen">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={dict.nav.cart}
            aria-haspopup="dialog"
            className="relative cursor-pointer p-1 leading-none text-linen"
          >
            <BagIcon />
            {ready && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bronze px-1 font-mono text-[10px] font-bold text-ink">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? dict.nav.close : dict.nav.menu}
            aria-expanded={menuOpen}
            className="cursor-pointer p-1.5 leading-none text-linen md:hidden"
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
        <div className="flex flex-col border-t border-stone/20 bg-carbon/97 py-2 backdrop-blur-lg md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-[var(--spacing-gutter)] py-4 text-base ${
                link.active ? 'text-linen' : 'text-stone'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-1.5 flex gap-4 border-t border-stone/20 px-[var(--spacing-gutter)] pb-2.5 pt-4 font-mono text-[13px] text-stone">
            {plannedLocales.map((item) => {
              const available = (locales as readonly string[]).includes(item)
              return available ? (
                <Link
                  key={item}
                  href={switchTo(item)}
                  hrefLang={item}
                  className={item === locale ? 'text-linen' : 'text-stone'}
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
