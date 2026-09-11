'use client'

/**
 * Una línea del carrito.
 *
 * El selector de cantidad se apaga cuando `maxUnits` es 1, que con piezas
 * únicas es el caso más frecuente: mostrar un "+" que siempre falla es
 * prometer algo que no existe. En su lugar se dice que es pieza única.
 */

import Link from 'next/link'

import { useCart } from './cart-provider'
import { formatPrice } from '@/lib/format'
import type { CartLine } from '@/lib/commerce/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function CartLineRow({
  line,
  locale,
  dict,
  compact = false,
}: {
  line: CartLine
  locale: Locale
  dict: Dictionary
  compact?: boolean
}) {
  const { setQuantity, remove, busy } = useCart()
  const unique = line.maxUnits <= 1

  return (
    <li className="flex gap-4 border-b border-ink/12 py-4 last:border-b-0">
      <Link
        href={`/${locale}/tienda/${line.slug}`}
        className="block shrink-0 overflow-hidden bg-parchment"
        tabIndex={line.slug ? 0 : -1}
      >
        {line.image ? (
          // Imagen del motor o del catálogo: sin next/image porque el origen
          // todavía puede ser un dominio externo no declarado.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={line.image}
            alt={line.name}
            width={compact ? 64 : 96}
            height={compact ? 80 : 120}
            className={`${compact ? 'h-20 w-16' : 'h-30 w-24'} object-cover`}
          />
        ) : (
          <span className={`${compact ? 'h-20 w-16' : 'h-30 w-24'} block`} />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link
          href={`/${locale}/tienda/${line.slug}`}
          className="font-display text-[17px] leading-tight text-ink hover:text-merlot"
        >
          {line.name}
        </Link>

        <p className="m-0 font-mono text-[11px] tracking-[0.08em] text-graphite uppercase">
          {line.sku}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          {unique ? (
            <span className="font-mono text-[11px] tracking-[0.08em] text-merlot uppercase">
              {dict.cart.unique}
            </span>
          ) : (
            <label className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-graphite uppercase">
              {dict.cart.quantity}
              <select
                value={line.quantity}
                disabled={busy}
                onChange={(event) => void setQuantity(line.key, Number(event.target.value))}
                className="border border-ink/25 bg-transparent px-2 py-1 text-[13px] text-ink disabled:opacity-50"
              >
                {Array.from({ length: line.maxUnits }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void remove(line.key)}
            className="cursor-pointer font-mono text-[11px] tracking-[0.08em] text-graphite underline underline-offset-4 uppercase hover:text-merlot disabled:opacity-50"
          >
            {dict.cart.remove}
          </button>
        </div>
      </div>

      <p className="m-0 shrink-0 font-mono text-[13px] text-ink">
        {formatPrice(line.lineTotal, locale)}
      </p>
    </li>
  )
}
