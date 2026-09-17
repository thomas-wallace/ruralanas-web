import type { MetadataRoute } from 'next'

import { about } from '@/lib/about'
import { blog } from '@/lib/blog'
import { catalog } from '@/lib/catalog'
import { locales, type Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { absoluteUrl } from '@/lib/site'

// Se regenera cada hora: un producto o una nota nuevos entran solos.
export const revalidate = 3600

/** Una entrada por idioma, cada una con sus alternativas en los demás. */
function entries(
  build: (locale: Locale) => string,
  options: { lastModified?: string; priority?: number } = {},
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((locale) => [locale, absoluteUrl(build(locale))]))
  return locales.map((locale) => ({
    url: absoluteUrl(build(locale)),
    lastModified: options.lastModified,
    priority: options.priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, sections, postPage] = await Promise.all([
    catalog.listProductSlugs().catch(() => []),
    about.listSections('es'),
    blog.listPosts({ locale: 'es', perPage: 100 }).catch(() => null),
  ])

  return [
    ...entries(routes.home, { priority: 1 }),
    ...entries((locale) => routes.shop(locale), { priority: 0.9 }),
    ...productSlugs.flatMap((slug) => entries((locale) => routes.product(locale, slug), { priority: 0.8 })),
    ...entries((locale) => routes.about(locale), { priority: 0.7 }),
    ...sections.flatMap((section) => entries((locale) => routes.about(locale, section.slug), { priority: 0.6 })),
    ...entries((locale) => routes.blog(locale), { priority: 0.6 }),
    ...(postPage?.posts ?? []).flatMap((post) =>
      entries((locale) => routes.post(locale, post.slug), { lastModified: post.updatedAt, priority: 0.5 }),
    ),
  ]
}
