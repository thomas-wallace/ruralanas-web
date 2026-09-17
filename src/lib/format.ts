import type { Locale } from '@/lib/i18n/config'
import type { Money } from '@/lib/catalog/types'

const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-UY',
  en: 'en-US',
}

/**
 * Precio con moneda explícita, siempre. La moneda base del negocio es USD y
 * el cliente tiene que verla sin ambigüedad: "249" no dice nada en un sitio
 * que vende a cuatro mercados.
 */
export function formatPrice(money: Money, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: money.amount % 1 === 0 ? 0 : 2,
  }).format(money.amount)
}

/** Reemplaza `{n}` y demás marcadores en las cadenas del diccionario. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

/**
 * Mes y año de una reseña. El día exacto no aporta nada y envejece peor:
 * "agosto de 2026" se lee bien un año después.
 */
export function formatMonthYear(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Fecha completa de una nota: "7 de diciembre de 2019". */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // La fecha de publicación es la de Uruguay, no la del servidor.
    timeZone: 'America/Montevideo',
  }).format(date)
}
