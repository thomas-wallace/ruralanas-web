'use client'

/**
 * Caja de compra de la ficha.
 *
 * Dos reglas que vienen del producto, no de la interfaz:
 *
 *   · Si la pieza tiene colores, hay que elegir uno antes de poder comprar. No
 *     se preselecciona ninguno: en una prenda artesanal el color no es un
 *     ajuste, es qué prenda te llevás.
 *   · El botón se bloquea mientras la operación viaja. El carrito vive en el
 *     servidor y un doble clic sobre una pieza única es exactamente lo que hay
 *     que impedir.
 */

import { useState } from 'react'

import { VariantPicker } from './variant-picker'
import { useCart } from '@/components/cart/cart-provider'
import { cartErrorMessage } from '@/components/cart/messages'
import type { Product, ProductVariant } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'

export function AddToCart({ product, dict }: { product: Product; dict: Dictionary }) {
  const { add, toggleWish, isWished, openDrawer, busy, ready } = useCart()
  const [variant, setVariant] = useState<ProductVariant | null>(null)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wished = ready && isWished(product.slug)
  const variants = product.variants ?? []
  const needsVariant = variants.length > 0
  const blocked = needsVariant && !variant

  const handleAdd = async () => {
    setError(null)

    if (blocked) {
      setError(dict.product.pickColorFirst)
      return
    }

    const outcome = await add({
      sku: variant?.sku ?? product.sku,
      slug: product.slug,
      commerceId: variant?.commerceId ?? product.commerceId,
      variation: variant ? [{ attribute: variant.attribute, value: variant.value }] : undefined,
    })

    if (!outcome.ok) {
      setError(cartErrorMessage(dict, outcome))
      return
    }

    setAdded(true)
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5">
      {needsVariant && (
        <VariantPicker
          variants={variants}
          selected={variant}
          onSelect={(next) => {
            setVariant(next)
            setError(null)
          }}
          label={dict.product.color}
          disabled={busy}
        />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={busy}
            aria-describedby={error ? 'add-to-cart-error' : undefined}
            className={`flex-1 cursor-pointer py-4 font-mono text-xs tracking-[0.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              blocked
                ? 'border border-earth/25 bg-transparent text-earth hover:border-olive'
                : 'bg-earth text-paper hover:bg-olive'
            }`}
          >
            {added ? dict.shop.added : blocked ? dict.product.pickColor : dict.product.addToCart}
          </button>

          <button
            type="button"
            onClick={() => toggleWish(product.slug)}
            aria-label={dict.nav.wishlist}
            aria-pressed={wished}
            className="flex w-14 cursor-pointer items-center justify-center border border-earth/25 text-earth transition-colors hover:border-olive"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={wished ? '#B4132E' : 'none'}
              stroke={wished ? '#B4132E' : 'currentColor'}
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M12 20s-7-4.6-9.2-8.4C1.3 8.9 2.6 5.5 5.7 5.1 8 4.8 9.4 6.3 12 8.7c2.6-2.4 4-3.9 6.3-3.6 3.1.4 4.4 3.8 2.9 6.5C19 15.4 12 20 12 20z" />
            </svg>
          </button>
        </div>

        {error && (
          <p id="add-to-cart-error" role="alert" className="m-0 font-mono text-[11px] leading-relaxed text-olive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
