'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import { AvailabilityBadge } from '@/components/shop/availability-badge'
import { formatPrice } from '@/lib/format'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

/**
 * Tarjeta de producto. Se usa en la colección de la home (fondo oscuro), en la
 * tienda y en los relacionados de la ficha (fondo claro).
 *
 * La proporción 4/5 y el aire alrededor son deliberados: en una grilla densa
 * una ruana de 249 USD se lee como saldo.
 */

const TONE = {
  dark: {
    surface: 'bg-transparent',
    title: 'text-paper',
    meta: 'text-slate',
    price: 'text-caramel',
    frame: 'bg-earth/40',
    button:
      'border border-slate/50 text-paper hover:bg-paper hover:text-earth hover:border-paper',
  },
  light: {
    surface: 'bg-transparent',
    title: 'text-earth',
    meta: 'text-slate',
    price: 'text-olive',
    frame: 'bg-paper',
    button: 'border border-olive text-olive hover:bg-earth hover:text-paper',
  },
} as const

export function ProductCard({
  product,
  locale,
  dict,
  tone = 'light',
  priority = false,
}: {
  product: ProductSummary
  locale: Locale
  dict: Dictionary
  tone?: keyof typeof TONE
  priority?: boolean
}) {
  const style = TONE[tone]
  const { add, toggleWish, isWished, ready, openDrawer } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const soldOut = product.availability.state === 'sold_out'
  // Con colores no se puede añadir desde la grilla: hay que elegir cuál. Un
  // botón que falla al pulsarlo es peor que un botón que dice a dónde lleva.
  const needsChoice = Boolean(product.hasVariants)
  const href = `/${locale}/tienda/${product.slug}`
  const wished = ready && isWished(product.slug)

  const handleAdd = async () => {
    const outcome = await add({
      sku: product.sku,
      slug: product.slug,
      commerceId: product.commerceId,
    })
    if (!outcome.ok) return
    setJustAdded(true)
    openDrawer()
    setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article className={`group flex flex-col ${style.surface}`}>
      <div className={`relative aspect-4/5 overflow-hidden ${style.frame}`}>
        {/* `relative` es obligatorio: sin él, la imagen con `fill` se posiciona
            contra un ancestro más lejano y basta un padding intermedio para
            que la foto se corra. Next avisa de esto en consola. */}
        <Link href={href} className="relative block h-full w-full">
          <Image
            src={product.image.src}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes="(max-width: 1280px) 50vw, 260px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>

        <button
          type="button"
          onClick={() => toggleWish(product.slug)}
          aria-label={dict.nav.wishlist}
          aria-pressed={wished}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate/40 bg-earth/60 leading-none text-paper transition-colors hover:border-paper"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={wished ? '#B4132E' : 'none'}
            stroke={wished ? '#B4132E' : 'currentColor'}
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M12 20s-7-4.6-9.2-8.4C1.3 8.9 2.6 5.5 5.7 5.1 8 4.8 9.4 6.3 12 8.7c2.6-2.4 4-3.9 6.3-3.6 3.1.4 4.4 3.8 2.9 6.5C19 15.4 12 20 12 20z" />
          </svg>
        </button>

        {product.availability.state !== 'in_stock' && (
          <div className="absolute bottom-2.5 left-2.5">
            <AvailabilityBadge availability={product.availability} dict={dict} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <div className={`mb-1.5 font-mono text-[10px] tracking-[0.2em] uppercase ${style.meta}`}>
          {product.category.name}
          {product.technique ? ` · ${dict.techniques[product.technique]}` : ''}
        </div>

        {/*
          `mb-3.5` es la separación mínima con el botón; el espacio que sobra lo
          absorbe el `mt-auto` de abajo. Así, en una fila con nombres de uno,
          dos y tres renglones, los tres botones quedan a la misma altura.
        */}
        <div className="mb-3.5 flex items-baseline justify-between gap-2.5">
          {/*
            Dos renglones siempre: recortados si el nombre es largo, reservados
            si es corto. Es lo que hace que todas las fichas de la grilla midan
            igual, en vez de que cada fila se estire según el nombre más largo
            que le haya tocado. El nombre entero está en `title` y en la ficha.
          */}
          <h3
            className={`line-clamp-2 min-h-[2.5em] font-display text-lg font-medium leading-tight ${style.title}`}
          >
            <Link
              href={href}
              title={product.name}
              className="hover:underline hover:underline-offset-4"
            >
              {product.name}
            </Link>
          </h3>
          <span className={`shrink-0 font-mono text-sm ${style.price}`}>
            {formatPrice(product.price, locale)}
          </span>
        </div>

        {soldOut || needsChoice ? (
          <Link
            href={href}
            className={`mt-auto py-2.5 text-center font-mono text-[11px] tracking-[0.1em] uppercase transition-colors ${style.button}`}
          >
            {soldOut ? dict.shop.notifyMe : dict.product.chooseOnProduct}
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className={`mt-auto cursor-pointer py-2.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors ${style.button}`}
          >
            {justAdded ? dict.shop.added : dict.shop.addToCart}
          </button>
        )}
      </div>
    </article>
  )
}
