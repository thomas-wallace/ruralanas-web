import { ChapterHands } from '@/components/home/chapter-hands'
import { ChapterOrigin } from '@/components/home/chapter-origin'
import { Collection } from '@/components/home/collection'
import { Hero } from '@/components/home/hero'
import { News } from '@/components/home/news'
import { StatsBand } from '@/components/home/stats-band'
import { Sustainability } from '@/components/home/sustainability'
import { Testimonials } from '@/components/home/testimonials'
import { WhyWool } from '@/components/home/why-wool'
import { WoolCare } from '@/components/home/wool-care'
import { WorldReach } from '@/components/home/world-reach'
import { ThreadTrail } from '@/components/ui/thread-trail'
import { catalog } from '@/lib/catalog'
import { listReviews } from '@/lib/reviews'
import { getDictionary, resolveLocale } from '@/lib/i18n'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const [featured, reviewsPage] = await Promise.all([
    catalog.listProducts({ locale, sort: 'featured', limit: 8 }),
    // Reales, de WooCommerce. Si todavía no hay ninguna, cae a las curadas y,
    // si tampoco hay, la sección se dibuja sin el bloque de testimonios.
    listReviews({ locale, limit: 3 }),
  ])

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ruralanas',
    description: dict.meta.description,
    foundingDate: '2003',
    address: {
      '@type': 'PostalAddress',
      streetAddress: dict.footer.address,
      addressLocality: 'Punta del Este',
      addressCountry: 'UY',
    },
    telephone: '+59842476969',
    sameAs: ['https://instagram.com/ruralanas'],
  }

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />

      <Hero dict={dict} />

      {/* Ancla de arranque del hilo de lana que recorre la home. */}
      <div id="threadStart" />
      <ThreadTrail startId="threadStart" endId="threadEnd" />

      <ChapterOrigin dict={dict} />
      <ChapterHands dict={dict} />
      <StatsBand dict={dict} />
      <WorldReach dict={dict} />
      <Sustainability dict={dict} />
      <WhyWool dict={dict} />
      <Collection products={featured} locale={locale} dict={dict} />
      <WoolCare dict={dict} />
      <Testimonials page={reviewsPage} locale={locale} dict={dict} />
      <News dict={dict} />
    </div>
  )
}
