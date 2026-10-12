import Link from 'next/link'

import type { CategoryFacet, Technique } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { shopHref, toggleTechnique, type ShopParams } from '@/lib/shop-params'

/**
 * Contenido de los desplegables de la barra de la tienda. Son enlaces y no
 * estado de React: cada combinación tiene su URL (ver `shop-params`).
 */

const TECHNIQUES: Technique[] = ['telar', 'dos-agujas', 'crochet']

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
 * Técnica de tejido. Sólo se usa cuando hay técnicas para filtrar: la técnica
 * todavía no existe en WooCommerce, llega con los extrafields de Dolibarr.
 */
export function FilterOptions({
  locale,
  dict,
  params,
}: {
  locale: Locale
  dict: Dictionary
  params: ShopParams
}) {
  const hasFilters = params.techniques.length > 0

  return (
    <div className="flex flex-col gap-4 p-1">
      <div>
        <div className="mb-2.5 font-sans text-[10px] tracking-[0.24em] text-slate uppercase">
          {dict.shop.technique}
        </div>
        <div className="flex flex-wrap gap-2">
          {TECHNIQUES.map((technique) => {
            const active = params.techniques.includes(technique)
            return (
              <Link
                key={technique}
                href={shopHref(locale, params, {
                  techniques: toggleTechnique(params.techniques, technique),
                })}
                aria-current={active ? 'true' : undefined}
                className={`rounded-sm border px-3 py-2 font-sans text-[11px] tracking-[0.08em] transition-colors ${
                  active
                    ? 'border-earth bg-earth text-paper'
                    : 'border-earth/30 text-earth hover:border-earth'
                }`}
              >
                {dict.techniques[technique]}
              </Link>
            )
          })}
        </div>
      </div>

      {hasFilters && (
        <Link
          href={shopHref(locale, params, { techniques: [] })}
          className="font-sans text-[11px] tracking-[0.08em] text-olive uppercase underline underline-offset-4"
        >
          {dict.shop.clearFilters}
        </Link>
      )}
    </div>
  )
}
