'use client'

/**
 * Cajón del carrito.
 *
 * Hasta ahora el botón de la bolsa del header no llevaba a ningún lado: se
 * podía agregar al carrito y no había forma de verlo. Este cajón cierra ese
 * callejón sin salida sin sacar al visitante de la página en la que estaba,
 * que es lo que menos conversión cuesta.
 */

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { CartLineRow } from './cart-line-row'
import { CartTotalsPanel } from './cart-totals'
import { useCart } from './cart-provider'
import { cartErrorMessage } from './messages'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function CartDrawer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { drawerOpen, closeDrawer, lines, cart, busy, lastError } = useCart()
  const panel = useRef<HTMLDivElement>(null)

  // Escape cierra, y el foco entra al panel: requisito AA del módulo 01.
  useEffect(() => {
    if (!drawerOpen) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    panel.current?.focus()

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [drawerOpen, closeDrawer])

  if (!drawerOpen) return null

  const error = cartErrorMessage(dict, lastError)

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        aria-label={dict.cart.close}
        onClick={closeDrawer}
        className="absolute inset-0 cursor-pointer bg-carbon/60 backdrop-blur-[2px]"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={dict.cart.title}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[420px] flex-col bg-linen-warm text-ink shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-ink/15 px-6 py-5">
          <h2 className="m-0 font-display text-[22px] font-medium">{dict.cart.title}</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={dict.cart.close}
            className="cursor-pointer p-1 leading-none text-ink hover:text-merlot"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 5l14 14" />
              <path d="M19 5L5 19" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6">
          {error && (
            <p role="alert" className="mt-4 mb-0 border-l-2 border-merlot bg-merlot/8 px-3 py-2 text-[13px] text-merlot">
              {error}
            </p>
          )}

          {cart?.notices.map((notice) => (
            <p key={notice} role="status" className="mt-4 mb-0 border-l-2 border-bronze bg-bronze/10 px-3 py-2 text-[13px] text-bark">
              {notice}
            </p>
          ))}

          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="m-0 font-display text-[19px] text-ink">{dict.cart.empty}</p>
              <p className="mx-auto mt-2 max-w-[26ch] text-[14px] leading-relaxed text-graphite">
                {dict.cart.emptyHint}
              </p>
              <Link
                href={`/${locale}/tienda`}
                onClick={closeDrawer}
                className="mt-6 inline-block bg-ink px-6 py-3 font-mono text-[11px] tracking-[0.12em] text-linen uppercase hover:bg-merlot"
              >
                {dict.cart.continueShopping}
              </Link>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {lines.map((line) => (
                <CartLineRow key={line.key} line={line} locale={locale} dict={dict} compact />
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && cart && (
          <footer className="border-t border-ink/15 px-6 py-5">
            <CartTotalsPanel
              totals={cart.totals}
              locale={locale}
              dict={dict}
              shippingKnown={Boolean(cart.country)}
            />
            <Link
              href={`/${locale}/checkout`}
              onClick={closeDrawer}
              aria-disabled={busy}
              className="mt-4 block bg-merlot py-4 text-center font-mono text-[11px] tracking-[0.12em] text-linen uppercase transition-colors hover:bg-merlot-bright"
            >
              {dict.cart.checkout}
            </Link>
            <Link
              href={`/${locale}/carrito`}
              onClick={closeDrawer}
              className="mt-2 block py-2 text-center font-mono text-[11px] tracking-[0.12em] text-graphite uppercase underline underline-offset-4 hover:text-ink"
            >
              {dict.cart.viewCart}
            </Link>
          </footer>
        )}
      </div>
    </div>
  )
}
