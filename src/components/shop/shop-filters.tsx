import Link from 'next/link'

import { swatchFor } from '@/lib/catalog/colors'
import type { CategoryFacet, ProductColor } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { shopHref, toggleColor, type ShopParams } from '@/lib/shop-params'

/**
 * Contenido de los desplegables de la barra de la tienda. Son enlaces y no
 * estado de React: cada combinación tiene su URL (ver `shop-params`).
 */

/** Un color del catálogo y en cuántas piezas existe. */
export interface ColorFacet extends ProductColor {
  count: number
}

export function CategoryOptions({
  locale,
  dict,
  categories,
  params,
  totalCount,
}: {
  locale: Locale
  dict: Dictionary
  categories: CategoryFacet[]
  params: ShopParams
  totalCount: number
}) {
  const row = (active: boolean) =>
    `flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-[13px] transition-colors ${
      active ? 'bg-earth font-semibold text-paper' : 'text-earth hover:bg-olive/5'
    }`

  return (
    <div className="flex flex-col gap-0.5">
      <Link
        href={shopHref(locale, params, { category: undefined })}
        aria-current={!params.category ? 'page' : undefined}
        className={row(!params.category)}
      >
        <span>{dict.shop.all}</span>
        <span className="font-sans text-[11px] text-slate">{totalCount}</span>
      </Link>

      {categories.map((category) => {
        const active = params.category === category.slug
        return (
          <Link
            key={category.id}
            href={shopHref(locale, params, { category: category.slug })}
            aria-current={active ? 'page' : undefined}
            className={row(active)}
          >
            <span>{category.name}</span>
            <span className="font-sans text-[11px] text-slate">{category.count}</span>
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Filtro por color. Los colores salen del catálogo, no de una lista fija: si
 * en Woo aparece uno nuevo, aparece acá. Se pueden marcar varios, y alcanza
 * con que la pieza exista en uno de ellos.
 */
export function ColorOptions({
  locale,
  dict,
  params,
  colors,
}: {
  locale: Locale
  dict: Dictionary
  params: ShopParams
  colors: ColorFacet[]
}) {
  const hasFilters = params.colors.length > 0

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="grid grid-cols-2 gap-1.5">
        {colors.map((color) => {
          const active = params.colors.includes(color.slug)
          const swatch = swatchFor(color.slug)
          return (
            <Link
              key={color.slug}
              href={shopHref(locale, params, { colors: toggleColor(params.colors, color.slug) })}
              aria-current={active ? 'true' : undefined}
              className={`flex items-center gap-2 rounded-sm border px-2.5 py-2 text-[13px] transition-colors ${
                active
                  ? 'border-earth bg-earth text-paper'
                  : 'border-earth/20 text-earth hover:border-earth/60'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 rounded-full border ${active ? 'border-paper/60' : 'border-earth/20'}`}
                style={swatch ? { backgroundColor: swatch } : undefined}
              />
              <span className="min-w-0 flex-1 truncate">{color.name}</span>
              <span className={`font-sans text-[11px] ${active ? 'text-paper/75' : 'text-slate'}`}>
                {color.count}
              </span>
            </Link>
          )
        })}
      </div>

      {hasFilters && (
        <Link
          href={shopHref(locale, params, { colors: [] })}
          className="font-sans text-[11px] tracking-[0.08em] text-olive uppercase underline underline-offset-4"
        >
          {dict.shop.clearFilters}
        </Link>
      )}
    </div>
  )
}
