import { CatalogPeek } from '@/components/home/catalog-peek'
import { Hero } from '@/components/home/hero'
import { News } from '@/components/home/news'
import { Pillars } from '@/components/home/pillars'
import { PillarsGallery } from '@/components/home/pillars-gallery'
import { StoreVisit } from '@/components/home/store-visit'
import { WorldReach } from '@/components/home/world-reach'
import { homeContent } from '@/content/home'
import { blog } from '@/lib/blog'
import { catalog } from '@/lib/catalog'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { site } from '@/lib/site'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const { catalogPeek } = homeContent

  const [featured, decoProduct, latest] = await Promise.all([
    catalog.listProducts({ locale, sort: 'featured', limit: catalogPeek.limit }),
    catalog.getProduct(catalogPeek.lines.deco.productSlug, locale),
    // Si WordPress no responde, la home se sirve igual, sin la sección de noticias.
    blog.listPosts({ locale, perPage: homeContent.news.limit }).catch((error: unknown) => {
      console.error('[home] no se pudieron leer las noticias', error)
      return null
    }),
  ])

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    description: dict.meta.description,
    foundingDate: site.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: dict.footer.address,
      addressLocality: site.locality,
      addressCountry: site.country,
    },
    telephone: site.phone,
    sameAs: [site.instagram],
  }

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />

      <Hero dict={dict} />
      <Pillars dict={dict} locale={locale} />
      <CatalogPeek
        products={featured.slice(0, catalogPeek.limit)}
        lines={[
          {
            key: 'deco',
            ...dict.peek.lines.deco,
            image: decoProduct?.images[0] ?? null,
            category: catalogPeek.lines.deco.category,
          },
          {
            key: 'leather',
            ...dict.peek.lines.leather,
            image: { src: catalogPeek.lines.leather.image, alt: dict.peek.lines.leather.alt },
            category: catalogPeek.lines.leather.category,
          },
        ]}
        locale={locale}
        dict={dict}
      />
      <WorldReach dict={dict} />
      <StoreVisit dict={dict} />
      <PillarsGallery dict={dict} locale={locale} />
      <News posts={latest?.posts ?? []} locale={locale} dict={dict} />
    </div>
  )
}
