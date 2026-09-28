/**
 * URL de la API de WordPress en el idioma pedido.
 *
 * TranslatePress, que ya traduce el sitio de producción, también traduce las
 * respuestas de la API REST cuando se piden bajo el prefijo del idioma:
 * `https://ruralanas.com/en/wp-json/...` devuelve nombres, categorías,
 * descripciones y noticias en inglés. Verificado el 27-09-2026 contra la Store
 * API y `/wp/v2/posts`. Los slugs, los IDs, los precios y el stock no cambian
 * entre idiomas, así que el resto del sitio no se entera.
 *
 * El español es el idioma original de WordPress y no lleva prefijo.
 */

import { defaultLocale, type Locale } from './config'

export function localizeWpApiUrl(base: string, locale: Locale): string {
  if (locale === defaultLocale) return base
  return base.replace(/\/wp-json(\/|$)/, `/${locale}/wp-json$1`)
}
