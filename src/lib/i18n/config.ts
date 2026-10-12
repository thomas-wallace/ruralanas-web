/**
 * Idiomas del sitio.
 *
 * ES, EN y PT (portugués de Brasil) activos; FR y DE están planificados y no
 * deben obligar a un refactor cuando entren: por eso las rutas ya viven bajo
 * `/[locale]`. El segmento de URL es `pt`; la variante, `pt-BR`.
 */

export const locales = ['es', 'en', 'pt'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

/** Idiomas que se muestran en el selector, incluidos los que todavía no existen. */
export const plannedLocales = ['es', 'en', 'pt', 'fr', 'de'] as const

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
}

/** `hreflang` de cada idioma. */
export const localeHtmlLang: Record<Locale, string> = {
  es: 'es-UY',
  en: 'en',
  pt: 'pt-BR',
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
