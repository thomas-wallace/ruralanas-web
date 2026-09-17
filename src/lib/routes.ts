/**
 * Rutas del sitio.
 *
 * Toda URL interna se arma acá. Si mañana `/noticias` pasa a llamarse `/blog`,
 * se cambia en un solo lugar y no queda un enlace roto escondido en un
 * componente.
 */

import type { LinkTarget } from '@/lib/about/types'
import type { Locale } from '@/lib/i18n/config'

export const routes = {
  home: (locale: Locale) => `/${locale}`,

  shop: (locale: Locale, category?: string) =>
    category ? `/${locale}/tienda?categoria=${encodeURIComponent(category)}` : `/${locale}/tienda`,
  product: (locale: Locale, slug: string) => `/${locale}/tienda/${slug}`,

  /** Sin `slug`, la portada de Nosotros; con `slug`, una de sus secciones. */
  about: (locale: Locale, slug?: string) => (slug ? `/${locale}/nosotros/${slug}` : `/${locale}/nosotros`),

  blog: (locale: Locale, options: { page?: number; category?: string } = {}) => {
    const search = new URLSearchParams()
    if (options.category) search.set('categoria', options.category)
    if (options.page && options.page > 1) search.set('pagina', String(options.page))
    const query = search.toString()
    return `/${locale}/noticias${query ? `?${query}` : ''}`
  },
  post: (locale: Locale, slug: string) => `/${locale}/noticias/${slug}`,
} as const

/** URL de un destino declarado en el contenido. */
export function resolveTarget(target: LinkTarget, locale: Locale): string {
  switch (target.kind) {
    case 'shop':
      return routes.shop(locale, target.category)
    case 'about':
      return routes.about(locale, target.slug)
    case 'blog':
      return routes.blog(locale)
    case 'post':
      return routes.post(locale, target.slug)
  }
}
