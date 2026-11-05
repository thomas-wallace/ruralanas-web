'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import { useFormatPrice } from '@/components/currency/currency-provider'
import { BagIcon } from '@/components/ui/bag-icon'
import { buttonClass } from '@/components/ui/button'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

/**
 * Agregado rápido desde el listado. El botón es el mismo de la ficha.
 *
 * Qué ofrece según el producto:
 * - Sin variantes y con stock: añade al carrito y abre el drawer.
 * - Con colores: lleva a la ficha, porque desde la grilla no se puede elegir
 *   cuál. Un botón que falla al pulsarlo es peor que uno que dice a dónde lleva.
 * - Agotado: lleva a la ficha, donde está el "Avisarme".
 */

function useQuickAdd(product: ProductSummary) {
  const { add, openDrawer } = useCart()
  const [pending, setPending] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = async () => {
    if (pending) return
    setPending(true)
    const outcome = await add({
      sku: product.sku,
      slug: product.slug,
      commerceId: product.commerceId,
    })
    setPending(false)
    if (!outcome.ok) return
    setJustAdded(true)
    openDrawer()
    setTimeout(() => setJustAdded(false), 1600)
  }

  return { handleAdd, pending, justAdded }
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

const PRICE_TONE = {
  light: 'text-olive',
  dark: 'text-caramel',
} as const

/**
 * Pie de la tarjeta: el precio y debajo el botón de compra, del mismo diseño
 * que el de la ficha (ver `ui/button`). Relleno si agrega al carrito; contorno
 * si primero hay que elegir color o la pieza está agotada.
 */
export function PurchaseRow({
  product,
  locale,
  dict,
  tone = 'light',
}: {
  product: ProductSummary
  locale: Locale
  dict: Dictionary
  tone?: keyof typeof PRICE_TONE
}) {
  const formatPrice = useFormatPrice(locale)
  const { handleAdd, pending, justAdded } = useQuickAdd(product)

  const href = `/${locale}/tienda/${product.slug}`
  const soldOut = product.availability.state === 'sold_out'
  const needsChoice = Boolean(product.hasVariants)

  return (
    <div className="mt-auto flex flex-col gap-3">
      <span className={`font-sans text-sm ${PRICE_TONE[tone]}`}>{formatPrice(product.price)}</span>

      {soldOut || needsChoice ? (
        <Link href={href} className={buttonClass('secondary', 'sm', 'w-full')}>
          {soldOut ? dict.shop.notifyMe : dict.product.chooseOnProduct}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          aria-label={justAdded ? dict.shop.added : `${dict.product.addToCart} · ${product.name}`}
          className={buttonClass('primary', 'sm', 'w-full disabled:cursor-wait')}
        >
          {justAdded ? <CheckIcon size={15} /> : <BagIcon size={15} />}
          {justAdded ? dict.shop.added : dict.shop.addToCart}
        </button>
      )}
    </div>
  )
}

/**
 * La misma acción en la vista lista: mismo botón, sin ocupar el ancho.
 */
export function QuickAdd({
  product,
  locale,
  dict,
}: {
  product: ProductSummary
  locale: Locale
  dict: Dictionary
}) {
  const { handleAdd, pending, justAdded } = useQuickAdd(product)
  const soldOut = product.availability.state === 'sold_out'

  if (soldOut || product.hasVariants) {
    return (
      <Link href={`/${locale}/tienda/${product.slug}`} className={buttonClass('secondary', 'sm')}>
        {soldOut ? dict.shop.notifyMe : dict.product.chooseOnProduct}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={pending}
      aria-label={justAdded ? dict.shop.added : `${dict.product.addToCart} · ${product.name}`}
      className={buttonClass('primary', 'sm', 'disabled:cursor-wait')}
    >
      {justAdded ? <CheckIcon size={15} /> : <BagIcon size={15} />}
      {justAdded ? dict.shop.added : dict.shop.addToCart}
    </button>
  )
}
