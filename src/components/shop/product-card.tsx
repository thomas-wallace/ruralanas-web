'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/components/cart/cart-provider'
import { AvailabilityBadge } from '@/components/shop/availability-badge'
import { PurchaseRow } from '@/components/shop/quick-add'
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
    frame: 'bg-earth/40',
  },
  light: {
    surface: 'bg-transparent',
    title: 'text-earth',
    meta: 'text-slate',
    frame: 'bg-paper',
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
  const { toggleWish, isWished, ready } = useCart()

  const href = `/${locale}/tienda/${product.slug}`
  const wished = ready && isWished(product.slug)

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
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
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
          Dos renglones siempre: recortados si el nombre es largo, reservados
          si es corto. Es lo que hace que todas las fichas de la grilla midan
          igual, en vez de que cada fila se estire según el nombre más largo
          que le haya tocado. El nombre entero está en `title` y en la ficha.
          Usa todo el ancho: el precio vive en la fila de compra.
        */}
        <h3
          className={`mb-3 line-clamp-2 min-h-[2.6em] font-sans text-[17px] font-normal leading-[1.3] ${style.title}`}
        >
          <Link
            href={href}
            title={product.name}
            className="hover:underline hover:underline-offset-4"
          >
            {product.name}
          </Link>
        </h3>

        <PurchaseRow product={product} locale={locale} dict={dict} tone={tone} />
      </div>
    </article>
  )
}
