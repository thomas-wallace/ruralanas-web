'use client'

import { useRouter } from 'next/navigation'

import type { SortOrder } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { shopHref, type ShopParams } from '@/lib/shop-params'

export function SortSelect({
  locale,
  dict,
  params,
}: {
  locale: Locale
  dict: Dictionary
  params: ShopParams
}) {
  const router = useRouter()

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{dict.shop.sort}</span>
      <select
        value={params.sort}
        onChange={(event) =>
          router.push(shopHref(locale, params, { sort: event.target.value as SortOrder }))
        }
        className="cursor-pointer rounded-sm border border-earth/30 bg-transparent px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-earth uppercase"
      >
        <option value="featured">{dict.shop.sortFeatured}</option>
        <option value="price-asc">{dict.shop.sortPriceAsc}</option>
        <option value="price-desc">{dict.shop.sortPriceDesc}</option>
      </select>
    </label>
  )
}
