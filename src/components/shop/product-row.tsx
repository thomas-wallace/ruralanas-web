'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AvailabilityBadge } from '@/components/shop/availability-badge'
import { QuickAdd } from '@/components/shop/quick-add'
import { useFormatPrice } from '@/components/currency/currency-provider'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

/**
 * Vista de lista. Es la variante "inventario" del prototipo: densa, pensada
 * para quien ya sabe qué busca y para el comprador mayorista.
 */
export function ProductRow({
  product,
  locale,
  dict,
}: {
  product: ProductSummary
  locale: Locale
  dict: Dictionary
}) {
  const formatPrice = useFormatPrice(locale)
  const href = `/${locale}/tienda/${product.slug}`
  const soldOut = product.availability.state === 'sold_out'
  const needsChoice = Boolean(product.hasVariants)

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-earth/12 px-2 py-3.5 transition-colors hover:bg-paper sm:grid-cols-[86px_1.6fr_1fr_110px_130px] sm:gap-5">
      <Link href={href} className="relative block h-16 w-16 overflow-hidden bg-paper sm:h-[86px] sm:w-[86px]">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="86px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0">
        <Link href={href} className="text-[15px] font-semibold text-earth hover:underline">
          {product.name}
        </Link>
        <div className="mt-0.5 truncate text-xs text-slate">
          {product.colorName}
          {product.technique ? ` · ${dict.techniques[product.technique]}` : ''}
        </div>
        <div className="mt-1.5 font-mono text-[13px] text-olive sm:hidden">
          {formatPrice(product.price)}
        </div>
      </div>

      <div className="hidden font-mono text-[10px] tracking-[0.2em] text-slate uppercase sm:block">
        {product.category.name}
      </div>

      <div className="hidden font-mono text-[13px] text-olive sm:block">
        {formatPrice(product.price)}
      </div>

      <div className="text-right">
        {soldOut || needsChoice ? (
          <Link
            href={href}
            className="font-mono text-[10px] tracking-[0.18em] text-slate uppercase underline underline-offset-4"
          >
            {soldOut ? dict.shop.notifyMe : dict.product.chooseOnProduct}
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            {product.availability.state !== 'in_stock' && (
              <AvailabilityBadge availability={product.availability} dict={dict} />
            )}
            <QuickAdd product={product} dict={dict} />
          </div>
        )}
      </div>
    </div>
  )
}
