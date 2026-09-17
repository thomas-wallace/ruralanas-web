import type { Metadata } from 'next'

import { ContentBlocks } from '@/components/about/content-blocks'
import { PageHero } from '@/components/about/page-hero'
import { SectionCards } from '@/components/about/section-cards'
import { SectionNav } from '@/components/about/section-nav'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { about } from '@/lib/about'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const hub = await about.getHub(locale)

  return {
    title: hub.meta.title,
    description: hub.meta.description,
    alternates: {
      canonical: routes.about(locale),
      languages: Object.fromEntries(locales.map((item) => [item, routes.about(item)])),
    },
    openGraph: {
      title: hub.meta.title,
      description: hub.meta.description,
      images: [hub.image.src],
    },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)
  const [hub, sections] = await Promise.all([about.getHub(locale), about.listSections(locale)])

  return (
    <div className="bg-linen-warm text-ink">
      <PageHero
        eyebrow={hub.eyebrow}
        title={hub.title}
        lead={hub.lead}
        image={hub.image}
        breadcrumbs={
          <Breadcrumbs
            items={[{ label: dict.nav.home, href: routes.home(locale) }, { label: dict.about.breadcrumb }]}
          />
        }
      />
      <SectionNav sections={sections} locale={locale} dict={dict} />
      <ContentBlocks blocks={hub.blocks} locale={locale} />
      <SectionCards title={hub.sectionsTitle} sections={sections} locale={locale} dict={dict} />
    </div>
  )
}
