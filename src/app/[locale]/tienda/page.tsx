import type { Metadata } from 'next'
import Link from 'next/link'

import { FiltersDrawer } from '@/components/shop/filters-drawer'
import { ProductCard } from '@/components/shop/product-card'
import { ProductRow } from '@/components/shop/product-row'
import { ShopFilters } from '@/components/shop/shop-filters'
import { SortSelect } from '@/components/shop/sort-select'
import { catalog } from '@/lib/catalog'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { parseShopParams, shopHref } from '@/lib/shop-params'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)

  return {
    title: `${dict.shop.title} · Ruralanas`,
    description: dict.shop.lead,
    alternates: {
      canonical: `/${locale}/tienda`,
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}/tienda`])),
    },
  }
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const shopParams = parseShopParams(await searchParams)

  const [products, categories, allProducts] = await Promise.all([
    catalog.listProducts({
      locale,
      category: shopParams.category,
      techniques: shopParams.techniques,
      onlyAvailable: shopParams.onlyAvailable,
      sort: shopParams.sort,
    }),
    catalog.listCategories(locale),
    catalog.listProducts({ locale }),
  ])

  const activeFilters =
    (shopParams.category ? 1 : 0) +
    shopParams.techniques.length +
    (shopParams.onlyAvailable ? 1 : 0)

  const filters = (
    <ShopFilters
      locale={locale}
      dict={dict}
      categories={categories}
      params={shopParams}
      totalCount={allProducts.length}
      showTechniques={allProducts.some((product) => product.technique)}
    />
  )

  const viewLink = (view: 'grid' | 'list', label: string, path: string) => (
    <Link
      href={shopHref(locale, shopParams, { view })}
      aria-current={shopParams.view === view}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-sm border transition-colors ${
        shopParams.view === view
          ? 'border-ink bg-ink text-linen'
          : 'border-ink/25 text-ink hover:border-ink'
      }`}
    >
      <span className="sr-only">{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d={path} />
      </svg>
    </Link>
  )

  return (
    <div className="bg-linen-warm text-ink">
      {/* Encabezado oscuro: separa la tienda del relato y deja respirar la grilla. */}
      <div className="bg-ink px-[var(--spacing-gutter)] pb-10 pt-[104px] text-linen">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(38px,6vw,68px)] font-medium leading-none">
            {dict.shop.title}
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-linen/70">
            {dict.shop.lead}
          </p>
          <div className="mt-6 font-mono text-[11px] tracking-[0.18em] text-bronze uppercase">
            {allProducts.length} {dict.shop.pieces} · {dict.shop.shipping} · {dict.shop.currency}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)] py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr] lg:gap-10">
          <aside className="hidden border-r border-ink/12 pr-6 lg:block">{filters}</aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/12 pb-4">
              <div className="font-mono text-[11px] tracking-[0.18em] text-stone uppercase">
                {products.length} {products.length === 1 ? dict.shop.piece : dict.shop.pieces}
              </div>

              <div className="flex items-center gap-2.5">
                <FiltersDrawer
                  label={dict.shop.filters}
                  closeLabel={dict.nav.close}
                  activeCount={activeFilters}
                >
                  {filters}
                </FiltersDrawer>

                <div className="flex gap-1.5">
                  {viewLink('grid', dict.shop.viewGrid, 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z')}
                  {viewLink('list', dict.shop.viewList, 'M2 4h12M2 8h12M2 12h12')}
                </div>

                <SortSelect locale={locale} dict={dict} params={shopParams} />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="m-0 font-display text-2xl">{dict.shop.empty}</p>
                <p className="mx-auto mt-3 max-w-[420px] text-sm text-graphite">
                  {dict.shop.emptyHint}
                </p>
                <Link
                  href={shopHref(locale, shopParams, {
                    category: undefined,
                    techniques: [],
                    onlyAvailable: false,
                  })}
                  className="mt-6 inline-block border-b border-merlot pb-1 font-mono text-[11px] tracking-[0.1em] text-merlot uppercase"
                >
                  {dict.shop.clearFilters}
                </Link>
              </div>
            ) : shopParams.view === 'grid' ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    dict={dict}
                    tone="light"
                    priority={index < 3}
                  />
                ))}
              </div>
            ) : (
              <div className="border-t border-ink/12">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} locale={locale} dict={dict} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
