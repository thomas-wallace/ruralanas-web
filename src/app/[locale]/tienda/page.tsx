import type { Metadata } from 'next'
import Link from 'next/link'

import { CurrentCurrency } from '@/components/currency/currency-switch'
import { ProductCard } from '@/components/shop/product-card'
import { ProductRow } from '@/components/shop/product-row'
import { CategoryOptions, ColorOptions, type ColorFacet } from '@/components/shop/shop-filters'
import { ShopSearch } from '@/components/shop/shop-search'
import { ToolbarMenu } from '@/components/shop/toolbar-menu'
import { Watermark } from '@/components/ui/watermark'
import { catalog } from '@/lib/catalog'
import { COLLECTIONS, type ProductSummary } from '@/lib/catalog/types'
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
    title: `${dict.shop.title} - Ruralanas`,
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

  const [products, categories, allProducts, collectionSizes] = await Promise.all([
    catalog.listProducts({
      locale,
      category: shopParams.category,
      collection: shopParams.collection,
      search: shopParams.q,
      colors: shopParams.colors,
      // Lo agotado no se muestra salvo que se pida con "Ver agotados".
      onlyAvailable: !shopParams.soldOut,
    }),
    catalog.listCategories(locale),
    catalog.listProducts({ locale }),
    // Una selección vacía no se ofrece: llevaría a una grilla sin nada.
    Promise.all(
      COLLECTIONS.map(async (collection) => ({
        collection,
        count: (await catalog.listProducts({ locale, collection, onlyAvailable: !shopParams.soldOut }))
          .length,
      })),
    ),
  ])

  // Los contadores (piezas, categorías, colores) cuentan lo que se ve: sin las
  // agotadas, salvo que estén a la vista.
  const available = allProducts.filter((product) => product.availability.state !== 'sold_out')
  const soldOutCount = allProducts.length - available.length
  const visible = shopParams.soldOut ? allProducts : available
  const categoryFacets = categories
    .map((category) => ({
      ...category,
      count: visible.filter((product) =>
        (product.categories ?? [product.category]).some((item) => item.slug === category.slug),
      ).length,
    }))
    // Una categoría con todo agotado desaparece, salvo que sea la elegida.
    .filter((category) => category.count > 0 || category.slug === shopParams.category)

  const collections = collectionSizes.filter((item) => item.count > 0)
  const colors = colorFacets(visible)
  const activeFilters = shopParams.colors.length
  const onlySearch =
    Boolean(shopParams.q) && !shopParams.category && !shopParams.collection && activeFilters === 0
  const activeCategory = categories.find((category) => category.slug === shopParams.category)

  const collectionLink = (collection: (typeof COLLECTIONS)[number] | undefined, label: string) => {
    const active = shopParams.collection === collection
    return (
      <Link
        key={collection ?? 'todo'}
        href={shopHref(locale, shopParams, { collection })}
        aria-current={active ? 'page' : undefined}
        className={`-mb-px shrink-0 border-b-2 pb-3 font-sans text-[12px] tracking-[0.14em] uppercase transition-colors ${
          active ? 'border-earth text-earth' : 'border-transparent text-slate hover:text-earth'
        }`}
      >
        {label}
      </Link>
    )
  }

  const viewLink = (view: 'grid' | 'list', label: string, path: string) => (
    <Link
      href={shopHref(locale, shopParams, { view })}
      aria-current={shopParams.view === view}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-sm border transition-colors ${
        shopParams.view === view
          ? 'border-earth bg-earth text-paper'
          : 'border-earth/25 text-earth hover:border-earth'
      }`}
    >
      <span className="sr-only">{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d={path} />
      </svg>
    </Link>
  )

  return (
    <div className="bg-paper text-earth">
      {/* Encabezado oscuro: separa la tienda del relato y deja respirar la grilla. */}
      <div className="relative isolate overflow-hidden bg-shell px-[var(--spacing-gutter)] pb-10 pt-[120px] text-earth">
        {/* El huso de la marca, hacia el centro: a la derecha del texto, sin irse al borde. */}
        <Watermark className="left-[62%] top-1/2 hidden h-[clamp(300px,34vw,420px)] -translate-x-1/2 -translate-y-[42%] opacity-[0.09] sm:block" />
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(38px,6vw,68px)] font-medium leading-none">
            {dict.shop.title}
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-slate">
            {dict.shop.lead}
          </p>
          <div className="mt-6 font-sans text-[11px] tracking-[0.18em] text-olive uppercase">
            {visible.length} {dict.shop.pieces} · {dict.shop.shipping} · {dict.shop.currency} <CurrentCurrency />
          </div>

          {/* Las selecciones: el primer nivel de la tienda, antes que categoría
              y color. Se combinan con los filtros de la barra. */}
          {collections.length > 0 && (
            <nav
              aria-label={dict.shop.collections}
              className="mt-9 flex gap-7 overflow-x-auto border-b border-earth/15"
            >
              {collectionLink(undefined, dict.shop.all)}
              {collections.map(({ collection }) =>
                collectionLink(collection, dict.shop.collection[collection]),
              )}
            </nav>
          )}
        </div>
      </div>

      {/*
        Barra de la tienda, fija bajo el header: se cambia de categoría desde
        la mitad de la grilla sin volver arriba. Reemplaza a la columna lateral,
        y la grilla gana ese ancho para las fotos. En móvil no se fija: ocupa dos
        renglones y, sumada al header, tapaba un cuarto de la pantalla.
      */}
      <div className="relative z-40 sm:sticky sm:top-[var(--spacing-header)] border-b border-earth/12 bg-paper/92 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-[var(--spacing-gutter)] py-3 lg:px-8">
          <div className="flex items-center gap-2.5">
            {/* Con una categoría elegida, el botón dice cuál: sin el menú a la
                vista, es la única forma de saber qué se está filtrando. */}
            <ToolbarMenu
              label={activeCategory ? activeCategory.name : dict.shop.categories}
              active={Boolean(activeCategory)}
            >
              <CategoryOptions
                locale={locale}
                dict={dict}
                categories={categoryFacets}
                params={shopParams}
                totalCount={visible.length}
              />
            </ToolbarMenu>

            {colors.length > 0 && (
              <ToolbarMenu
                label={activeFilters > 0 ? `${dict.shop.color} (${activeFilters})` : dict.shop.color}
                active={activeFilters > 0}
                wide
              >
                <ColorOptions locale={locale} dict={dict} params={shopParams} colors={colors} />
              </ToolbarMenu>
            )}

            {/* Agotados: fuera por defecto; un enlace los suma o los saca. */}
            {soldOutCount > 0 && (
              <Link
                href={shopHref(locale, shopParams, { soldOut: !shopParams.soldOut })}
                aria-pressed={shopParams.soldOut}
                className={`flex items-center gap-2 rounded-sm border px-3 py-2 font-sans text-[11px] tracking-[0.06em] uppercase transition-colors ${
                  shopParams.soldOut
                    ? 'border-earth bg-earth text-paper'
                    : 'border-earth/30 text-earth hover:border-earth'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-3 w-3 items-center justify-center border ${
                    shopParams.soldOut ? 'border-paper' : 'border-earth/50'
                  }`}
                >
                  {shopParams.soldOut && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6.5 5 9.5 10 3" />
                    </svg>
                  )}
                </span>
                {dict.shop.showSoldOut} ({soldOutCount})
              </Link>
            )}
          </div>

          {/* En móvil el buscador va primero y a todo el ancho; desde `sm`,
              a la derecha, junto al conteo que reacciona a lo que se escribe. */}
          <ShopSearch
            locale={locale}
            dict={dict}
            params={shopParams}
            className="order-first basis-full sm:order-none sm:ml-auto sm:basis-60"
          />

          <div className="flex items-center gap-2.5">
            <div className="hidden font-sans text-[11px] tracking-[0.18em] text-slate uppercase md:block">
              {products.length} {products.length === 1 ? dict.shop.piece : dict.shop.pieces}
            </div>

            <div className="flex gap-1.5">
              {viewLink('grid', dict.shop.viewGrid, 'M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z')}
              {viewLink('list', dict.shop.viewList, 'M2 4h12M2 8h12M2 12h12')}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)] py-8 lg:px-8">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="m-0 font-display text-2xl">
              {shopParams.q ? dict.shop.emptySearch.replace('{q}', shopParams.q) : dict.shop.empty}
            </p>
            <p className="mx-auto mt-3 max-w-[420px] text-sm text-slate">
              {dict.shop.emptyHint}
            </p>
            <Link
              href={shopHref(locale, shopParams, {
                q: undefined,
                category: undefined,
                collection: undefined,
                colors: [],
              })}
              className="mt-6 inline-block border-b border-olive pb-1 font-sans text-[11px] tracking-[0.1em] text-olive uppercase"
            >
              {onlySearch ? dict.shop.clearSearch : dict.shop.clearFilters}
            </Link>
          </div>
        ) : shopParams.view === 'grid' ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="border-t border-earth/12">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Los colores que existen en el catálogo, con cuántas piezas hay de cada uno.
 * Del más frecuente al menos: el natural va primero porque es el de casi todo.
 */
function colorFacets(products: ProductSummary[]): ColorFacet[] {
  const facets = new Map<string, ColorFacet>()
  for (const product of products) {
    for (const color of product.colors ?? []) {
      const current = facets.get(color.slug)
      facets.set(color.slug, { ...color, count: (current?.count ?? 0) + 1 })
    }
  }
  return [...facets.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
