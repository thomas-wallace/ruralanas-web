'use client'

/**
 * Página de carrito.
 *
 * Existe además del cajón porque es la URL que la gente guarda, comparte y a
 * la que vuelve desde el email de carrito abandonado (módulo 03). El cajón
 * sirve para seguir comprando; esta página, para decidir.
 */

import Link from 'next/link'

import { CartLineRow } from './cart-line-row'
import { CartTotalsPanel } from './cart-totals'
import { useCart } from './cart-provider'
import { cartErrorMessage } from './messages'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function CartPageBody({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lines, cart, ready, busy, lastError } = useCart()
  const error = cartErrorMessage(dict, lastError)

  if (!ready) {
    return (
      <p className="py-20 text-center font-mono text-[12px] tracking-[0.12em] text-slate uppercase">
        {dict.cart.updating}
      </p>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="m-0 font-display text-[24px] text-earth">{dict.cart.empty}</p>
        <p className="mx-auto mt-3 max-w-[38ch] text-[15px] leading-relaxed text-slate">
          {dict.cart.emptyHint}
        </p>
        <Link
          href={`/${locale}/tienda`}
          className="mt-8 inline-block bg-earth px-8 py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive"
        >
          {dict.cart.continueShopping}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
      <div>
        {error && (
          <p role="alert" className="mb-6 border-l-2 border-olive bg-olive/8 px-4 py-3 text-[14px] text-olive">
            {error}
          </p>
        )}

        {cart?.notices.map((notice) => (
          <p key={notice} role="status" className="mb-6 border-l-2 border-caramel bg-caramel/10 px-4 py-3 text-[14px] text-earth">
            {notice}
          </p>
        ))}

        <ul className="m-0 list-none border-t border-earth/12 p-0">
          {lines.map((line) => (
            <CartLineRow key={line.key} line={line} locale={locale} dict={dict} />
          ))}
        </ul>

        <Link
          href={`/${locale}/tienda`}
          className="mt-8 inline-block font-mono text-[11px] tracking-[0.12em] text-slate uppercase underline underline-offset-4 hover:text-earth"
        >
          {dict.cart.continueShopping}
        </Link>
      </div>

      {cart && (
        <aside className="h-fit border border-earth/15 bg-paper p-6 lg:sticky lg:top-28">
          <CartTotalsPanel
            totals={cart.totals}
            locale={locale}
            dict={dict}
            shippingKnown={Boolean(cart.country)}
          />
          <Link
            href={`/${locale}/checkout`}
            aria-disabled={busy}
            className="mt-5 block bg-earth py-4 text-center font-mono text-[11px] tracking-[0.12em] text-paper uppercase transition-colors hover:bg-olive"
          >
            {dict.cart.checkout}
          </Link>
          <p className="mt-4 mb-0 text-center text-[12px] leading-relaxed text-slate">
            {dict.shop.shipping} · {dict.shop.currency}
          </p>
        </aside>
      )}
    </div>
  )
}
