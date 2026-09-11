import Link from 'next/link'

import type { CategoryFacet, Technique } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import {
  hasActiveFilters,
  shopHref,
  toggleTechnique,
  type ShopParams,
} from '@/lib/shop-params'

const TECHNIQUES: Technique[] = ['telar', 'dos-agujas', 'crochet']

export function ShopFilters({
  locale,
  dict,
  categories,
  params,
  totalCount,
  showTechniques = true,
}: {
  locale: Locale
  dict: Dictionary
  categories: CategoryFacet[]
  params: ShopParams
  totalCount: number
  /**
   * La técnica de tejido todavía no existe en WooCommerce: llega con los
   * extrafields de Dolibarr. Mostrar el filtro sin datos detrás sólo sirve
   * para que alguien lo toque y se encuentre la grilla vacía.
   */
  showTechniques?: boolean
}) {
  const row = (active: boolean) =>
    `flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-left text-[13px] transition-colors ${
      active ? 'bg-ink font-semibold text-linen' : 'text-ink hover:bg-ink/5'
    }`

  return (
    <div className="flex flex-col gap-6.5">
      <div>
        <div className="mb-3.5 font-mono text-[10px] tracking-[0.24em] text-stone uppercase">
          {dict.shop.categories}
        </div>
        <div className="flex flex-col gap-0.5">
          <Link
            href={shopHref(locale, params, { category: undefined })}
            className={row(!params.category)}
          >
            <span>{dict.shop.all}</span>
            <span className="font-mono text-[11px] text-stone">{totalCount}</span>
          </Link>

          {categories.map((category) => (
            <Link
              key={category.id}
              href={shopHref(locale, params, { category: category.slug })}
              className={row(params.category === category.slug)}
            >
              <span>{category.name}</span>
              <span className="font-mono text-[11px] text-stone">{category.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {showTechniques && (
      <div className="border-t border-ink/12 pt-5.5">
        <div className="mb-3.5 font-mono text-[10px] tracking-[0.24em] text-stone uppercase">
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
                className={`rounded-sm border px-3 py-2 font-mono text-[11px] tracking-[0.08em] transition-colors ${
                  active
                    ? 'border-ink bg-ink text-linen'
                    : 'border-ink/30 text-ink hover:border-ink'
                }`}
              >
                {dict.techniques[technique]}
              </Link>
            )
          })}
        </div>
      </div>
      )}

      <div className="border-t border-ink/12 pt-5.5">
        <Link
          href={shopHref(locale, params, { onlyAvailable: !params.onlyAvailable })}
          className="flex items-center gap-2.5 text-[13px] text-ink"
        >
          <span
            aria-hidden="true"
            className={`flex h-4 w-4 items-center justify-center border ${
              params.onlyAvailable ? 'border-merlot bg-merlot text-linen' : 'border-ink/40'
            }`}
          >
            {params.onlyAvailable && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6.5l2.5 2.5L10 3.5" />
              </svg>
            )}
          </span>
          {dict.shop.onlyAvailable}
        </Link>
      </div>

      {hasActiveFilters(params) && (
        <Link
          href={shopHref(locale, params, {
            category: undefined,
            techniques: [],
            onlyAvailable: false,
          })}
          className="font-mono text-[11px] tracking-[0.08em] text-merlot uppercase underline underline-offset-4"
        >
          {dict.shop.clearFilters}
        </Link>
      )}

      <p className="border-t border-ink/12 pt-5.5 text-xs leading-relaxed text-graphite">
        {dict.shop.note}
        <br />
        <span className="font-mono text-merlot">USD</span>
      </p>
    </div>
  )
}
