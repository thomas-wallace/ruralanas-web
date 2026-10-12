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
 *
 * No todos los idiomas del sitio existen en TranslatePress. Hoy sólo `en`:
 * `/pt/wp-json/...` devuelve 404 (verificado el 10-10-2026). Un idioma que no
 * está en la lista pide la versión original, en español, en vez de romper la
 * tienda y el blog. El día que se active portugués en TranslatePress, se suma
 * `pt` acá y nada más.
 */

import { defaultLocale, type Locale } from './config'

const TRANSLATED_IN_WORDPRESS: ReadonlySet<Locale> = new Set(['en'])

export function localizeWpApiUrl(base: string, locale: Locale): string {
  if (locale === defaultLocale || !TRANSLATED_IN_WORDPRESS.has(locale)) return base
  return base.replace(/\/wp-json(\/|$)/, `/${locale}/wp-json$1`)
}
