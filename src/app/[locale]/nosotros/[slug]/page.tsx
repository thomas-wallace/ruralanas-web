import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ContentBlocks } from '@/components/about/content-blocks'
import { PageHero } from '@/components/about/page-hero'
import { SectionCards } from '@/components/about/section-cards'
import { SectionNav } from '@/components/about/section-nav'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { about } from '@/lib/about'
import { getDictionary, resolveLocale } from '@/lib/i18n'
import { locales } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

// Sólo existen las secciones declaradas en el contenido.
export const dynamicParams = false

export async function generateStaticParams() {
  const perLocale = await Promise.all(
    locales.map(async (locale) =>
      (await about.listSections(locale)).map((section) => ({ locale, slug: section.slug })),
    ),
  )
  return perLocale.flat()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const section = await about.getSection(slug, locale)
  if (!section) return {}

  return {
    title: section.meta.title,
    description: section.meta.description,
    alternates: {
      canonical: routes.about(locale, slug),
      languages: Object.fromEntries(locales.map((item) => [item, routes.about(item, slug)])),
    },
    openGraph: {
      title: section.meta.title,
      description: section.meta.description,
      images: [section.image.src],
    },
  }
}

export default async function AboutSectionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const dict = getDictionary(locale)

  const [section, sections] = await Promise.all([
    about.getSection(slug, locale),
    about.listSections(locale),
  ])
  if (!section) notFound()

  const others = sections.filter((item) => item.slug !== slug)

  return (
    <div className="bg-paper text-earth">
      <PageHero
        eyebrow={section.eyebrow}
        title={section.title}
        lead={section.lead}
        image={section.image}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: dict.nav.home, href: routes.home(locale) },
              { label: dict.about.breadcrumb, href: routes.about(locale) },
              { label: section.eyebrow },
            ]}
          />
        }
      />
      <SectionNav sections={sections} current={slug} locale={locale} dict={dict} />
      <ContentBlocks blocks={section.blocks} locale={locale} />
      <SectionCards title={dict.about.next} sections={others} locale={locale} dict={dict} />
    </div>
  )
}
