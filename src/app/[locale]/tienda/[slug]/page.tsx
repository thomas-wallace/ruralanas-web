import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCart } from '@/components/product/add-to-cart'
import { ProductGallery } from '@/components/product/product-gallery'
import { RestockForm } from '@/components/product/restock-form'
import { AvailabilityBadge } from '@/components/shop/availability-badge'
import { ProductCard } from '@/components/shop/product-card'
import { Reveal } from '@/components/ui/reveal'
import { catalog } from '@/lib/catalog'
import { formatPrice, interpolate } from '@/lib/format'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'

export async function generateStaticParams() {
  const slugs = await catalog.listProductSlugs()
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const product = await catalog.getProduct(slug, locale)
  if (!product) return {}

  return {
    title: `${product.name} · Ruralanas`,
    description: product.summary,
    alternates: {
      canonical: `/${locale}/tienda/${slug}`,
      languages: Object.fromEntries(locales.map((item) => [item, `/${item}/tienda/${slug}`])),
    },
    openGraph: {
      title: product.name,
      description: product.summary,
      type: 'website',
      images: [product.image.src],
    },
  }
}

const SCHEMA_AVAILABILITY = {
  in_stock: 'https://schema.org/InStock',
  last_one: 'https://schema.org/LimitedAvailability',
  made_to_order: 'https://schema.org/PreOrder',
  sold_out: 'https://schema.org/OutOfStock',
} as const

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dict = getDictionary(locale)

  const product = await catalog.getProduct(slug, locale)
  if (!product) notFound()

  const related = (
    await Promise.all(product.relatedSlugs.map((item) => catalog.getProduct(item, locale)))
  ).filter((item) => item !== null)

  const soldOut = product.availability.state === 'sold_out'

  const note =
    product.availability.state === 'last_one'
      ? dict.availability.uniqueNote
      : product.availability.state === 'made_to_order'
        ? interpolate(dict.availability.madeToOrderNote, {
            n: product.availability.leadTimeDays ?? 21,
          })
        : soldOut
          ? dict.availability.soldOutNote
          : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary,
    sku: product.sku,
    image: [product.image.src],
    material: product.composition,
    brand: { '@type': 'Brand', name: 'Ruralanas' },
    offers: {
      '@type': 'Offer',
      price: product.price.amount,
      priceCurrency: product.price.currency,
      availability: SCHEMA_AVAILABILITY[product.availability.state],
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  const specRow = (label: string, value: string) => (
    <div className="flex justify-between gap-6 border-b border-earth/10 py-3">
      <dt className="font-mono text-[11px] tracking-[0.14em] text-slate uppercase">{label}</dt>
      <dd className="m-0 text-right text-sm text-earth">{value}</dd>
    </div>
  )

  const artisan = product.artisan

  return (
    <div className="bg-paper text-earth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)] pb-16 pt-[104px] lg:px-8">
        <nav aria-label="breadcrumb" className="mb-8 font-mono text-[11px] tracking-[0.14em] uppercase">
          <Link href={`/${locale}/tienda`} className="text-slate hover:text-olive">
            ← {dict.product.backToShop}
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <ProductGallery product={product} dict={dict} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="font-mono text-[10px] tracking-[0.2em] text-slate uppercase">
              {product.category.name}
              {product.technique ? ` · ${dict.techniques[product.technique]}` : ''}
            </div>

            <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-medium leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl text-olive">
                {formatPrice(product.price, locale)}
              </span>
              <AvailabilityBadge availability={product.availability} dict={dict} />
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-slate">{product.summary}</p>

            {note && (
              <p className="mt-4 border-l-2 border-olive bg-olive/5 py-3 pl-4 text-sm leading-relaxed text-earth">
                {note}
              </p>
            )}

            <div className="mt-7">
              {soldOut ? (
                <RestockForm slug={product.slug} locale={locale} dict={dict} />
              ) : (
                <AddToCart product={product} dict={dict} />
              )}
            </div>

            {/* Envío y plazo acá, no recién en el checkout. */}
            <dl className="mt-8">
              {specRow(dict.product.size, product.measurements)}
              {specRow(dict.product.composition, product.composition)}
              {specRow(dict.product.shipping, product.shipping.estimate)}
              {specRow(dict.product.shippingFrom, product.shipping.from)}
              {specRow(dict.product.sku, product.sku)}
            </dl>
          </div>
        </div>
      </div>

      {/* ── Trazabilidad: lo único que nadie puede copiar ───────────────── */}
      {/* Sin datos de artesana el bloque no se dibuja. No se inventa un nombre:
          la trazabilidad es un argumento de venta sólo si es cierta. */}
      {artisan && (
        <section className="bg-shell px-[var(--spacing-gutter)] py-[clamp(60px,8vh,110px)] text-earth">
          <Reveal className="mx-auto max-w-[900px]">
            <div className="mb-4 font-mono text-[11px] tracking-[0.2em] text-olive uppercase">
              {dict.product.artisanTitle}
            </div>

            <h2 className="m-0 font-display text-[clamp(28px,4vw,52px)] font-medium leading-tight">
              {dict.product.madeBy} {artisan.name}
              <span className="text-slate">
                {' '}
                {dict.product.inRegion} {artisan.region}
              </span>
            </h2>

            {artisan.bio && (
              <p className="mt-5 max-w-[620px] text-[15px] leading-relaxed text-slate">
                {artisan.bio}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate/20 pt-6 font-mono text-[11px] tracking-[0.14em] text-slate uppercase">
              {artisan.hoursForPiece ? (
                <span>
                  <span className="text-olive">{artisan.hoursForPiece}</span>{' '}
                  {dict.product.hours}
                </span>
              ) : null}
              {product.technique && (
                <span>
                  {dict.product.technique}:{' '}
                  <span className="text-olive">{dict.techniques[product.technique]}</span>
                </span>
              )}
              <span>
                {dict.product.composition}: <span className="text-olive">{product.composition}</span>
              </span>
            </div>

            <p className="mt-6 max-w-[560px] text-xs leading-relaxed text-slate">
              {dict.product.artisanNote}
            </p>
          </Reveal>
        </section>
      )}

      {/* ── Relato y cuidados ──────────────────────────────────────────── */}
      <section className="px-[var(--spacing-gutter)] py-[clamp(60px,8vh,110px)] lg:px-8">
        <div className="mx-auto grid max-w-[1000px] gap-12 md:grid-cols-2">
          <Reveal>
            <h2 className="m-0 font-display text-3xl font-medium">{dict.product.processTitle}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate">{product.story}</p>
          </Reveal>

          <Reveal>
            <h2 className="m-0 font-display text-3xl font-medium">{dict.product.care}</h2>
            <ul className="mt-4 list-none space-y-2.5 p-0">
              {product.care.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-slate">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-earth" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-earth/10 px-[var(--spacing-gutter)] py-[clamp(60px,8vh,110px)] lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="m-0 mb-9 font-display text-[clamp(26px,3.5vw,40px)] font-medium">
              {dict.product.relatedTitle}
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  locale={locale}
                  dict={dict}
                  tone="light"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
