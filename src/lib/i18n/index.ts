import { en } from './dictionaries/en'
import { es, type Dictionary } from './dictionaries/es'
import { defaultLocale, isLocale, type Locale } from './config'

const dictionaries: Record<Locale, Dictionary> = { es, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

/** Normaliza un segmento de URL a un idioma soportado. */
export function resolveLocale(value: string | undefined): Locale {
  return value && isLocale(value) ? value : defaultLocale
}

export type { Dictionary }
export type { Locale }
