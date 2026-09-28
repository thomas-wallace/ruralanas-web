'use client'

/**
 * Bloque de totales.
 *
 * El envío se muestra siempre, incluso antes de conocerlo: dejar la línea en
 * blanco hasta el último paso es lo que hace que la gente abandone el
 * checkout. Si todavía no se calculó, se dice cuándo se va a calcular.
 */

import { useCurrency, useFormatPrice } from '@/components/currency/currency-provider'
import { formatPrice, interpolate } from '@/lib/format'
import type { CartTotals } from '@/lib/commerce/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function CartTotalsPanel({
  totals,
  locale,
  dict,
  shippingKnown,
}: {
  totals: CartTotals
  locale: Locale
  dict: Dictionary
  shippingKnown: boolean
}) {
  const display = useFormatPrice(locale)
  const { currency } = useCurrency()
  const money = (amount: number) => display({ amount, currency: totals.currency })
  // Woo cobra en dólares. Si la vidriera muestra otra moneda, el total real
  // se dice acá, antes del checkout, y no como sorpresa al pagar.
  const chargedIn =
    currency !== totals.currency
      ? formatPrice({ amount: totals.total, currency: totals.currency }, locale)
      : null

  const row = (label: string, value: string, strong = false) => (
    <div
      className={`flex items-baseline justify-between gap-4 py-2 ${
        strong ? 'border-t border-earth/20 pt-3 text-[17px]' : 'text-[14px]'
      }`}
    >
      <span className={strong ? 'font-display text-earth' : 'text-slate'}>{label}</span>
      <span className={`font-mono ${strong ? 'text-earth' : 'text-earth/80'}`}>{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col">
      {row(dict.cart.subtotal, money(totals.subtotal))}
      {row(
        dict.cart.shipping,
        shippingKnown
          ? totals.shipping > 0
            ? money(totals.shipping)
            : dict.cart.free
          : dict.cart.shippingPending,
      )}
      {totals.discount > 0 && row(dict.cart.discount, `− ${money(totals.discount)}`)}

      {/* Con precios que ya llevan el impuesto adentro, sumarlo como una línea
          más haría que el resumen no cierre. Se dice que está incluido. */}
      {totals.tax > 0 && !totals.taxIncluded && row(dict.cart.tax, money(totals.tax))}

      {row(dict.cart.total, money(totals.total), true)}

      {totals.tax > 0 && totals.taxIncluded && (
        <p className="mt-1.5 mb-0 text-right text-[12px] text-slate">
          {interpolate(dict.cart.taxIncluded, { amount: money(totals.tax) })}
        </p>
      )}

      {chargedIn && (
        <p className="mt-1.5 mb-0 text-right text-[12px] text-slate">
          {interpolate(dict.cart.chargedIn, { amount: chargedIn })}
        </p>
      )}
    </div>
  )
}
