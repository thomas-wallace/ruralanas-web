'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import { useFormatPrice } from '@/components/currency/currency-provider'
import { BagIcon } from '@/components/ui/bag-icon'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

/**
 * Agregado rápido desde el listado, con la bolsa de compras como gesto.
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

const ROW_TONE = {
  light: {
    rule: 'border-earth/15 group-hover/buy:border-earth/50',
    price: 'text-olive',
    action: 'text-olive group-hover/buy:text-earth',
  },
  dark: {
    rule: 'border-paper/15 group-hover/buy:border-paper/50',
    price: 'text-caramel',
    action: 'text-caramel group-hover/buy:text-paper',
  },
} as const

/**
 * Fila de compra al pie de la tarjeta: precio a la izquierda, acción a la
 * derecha, sobre una línea fina que va de borde a borde como la foto. Así la
 * compra es parte de la estructura de la tarjeta y no un elemento suelto.
 *
 * La palabra "Añadir" aparece al pasar el mouse; en pantallas táctiles no hay
 * hover y queda sólo la bolsa, que se entiende sola. Las acciones que llevan a
 * la ficha se escriben siempre, porque un ícono de bolsa que no añade engaña.
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
  tone?: keyof typeof ROW_TONE
}) {
  const style = ROW_TONE[tone]
  const formatPrice = useFormatPrice(locale)
  const { handleAdd, pending, justAdded } = useQuickAdd(product)

  const href = `/${locale}/tienda/${product.slug}`
  const soldOut = product.availability.state === 'sold_out'
  const needsChoice = Boolean(product.hasVariants)

  const label = 'font-mono text-[10px] tracking-[0.18em] uppercase'
  // La acción ocupa todo lo que el precio deja libre: el área para pulsar es
  // la fila entera, no sólo el ícono.
  const action = `flex flex-1 items-center justify-end gap-2 self-stretch transition-colors ${style.action}`

  return (
    <div
      className={`group/buy mt-auto flex items-center border-t pt-1 transition-colors duration-300 ${style.rule}`}
    >
      <span className={`py-2 font-mono text-sm ${style.price}`}>
        {formatPrice(product.price)}
      </span>

      {soldOut || needsChoice ? (
        <Link href={href} className={action}>
          <span className={label}>
            {soldOut ? dict.shop.notifyMe : dict.product.chooseOnProduct}
          </span>
          <span
            aria-hidden="true"
            className="text-xs transition-transform duration-300 group-hover/buy:translate-x-0.5"
          >
            →
          </span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          aria-label={justAdded ? dict.shop.added : `${dict.product.addToCart} · ${product.name}`}
          className={`group/add ${action} cursor-pointer disabled:cursor-wait disabled:opacity-70`}
        >
          <span
            className={`${label} transition-all duration-300 ${
              justAdded
                ? 'translate-x-0 opacity-100'
                : 'translate-x-1 opacity-0 group-hover/buy:translate-x-0 group-hover/buy:opacity-100 group-focus-visible/add:translate-x-0 group-focus-visible/add:opacity-100'
            }`}
          >
            {justAdded ? dict.shop.added : dict.shop.addToCart}
          </span>
          {justAdded ? <CheckIcon size={18} /> : <BagIcon size={18} />}
        </button>
      )}
    </div>
  )
}

/**
 * Variante compacta para la vista lista: un botón sólido con la bolsa. Sólo se
 * usa cuando el producto se puede añadir directo; los demás casos la lista los
 * resuelve con texto.
 */
export function QuickAdd({ product, dict }: { product: ProductSummary; dict: Dictionary }) {
  const { handleAdd, pending, justAdded } = useQuickAdd(product)

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={pending}
      aria-label={justAdded ? dict.shop.added : `${dict.product.addToCart} · ${product.name}`}
      title={justAdded ? dict.shop.added : dict.product.addToCart}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm bg-earth leading-none text-paper transition-colors hover:bg-olive disabled:cursor-wait disabled:opacity-70"
    >
      {justAdded ? <CheckIcon size={18} /> : <BagIcon size={18} />}
    </button>
  )
}
