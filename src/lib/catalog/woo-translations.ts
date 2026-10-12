/**
 * Lo que TranslatePress no traduce en la Store API.
 *
 * Pedida bajo `/en/`, la API devuelve en inglés el nombre y las descripciones
 * de cada pieza, y la lista de categorías de `/products/categories`. Pero
 * dentro de cada producto las categorías y los atributos (color, talle) siguen
 * en español: verificado el 27-09-2026. Las categorías se resuelven con esa
 * lista; los atributos, con esta tabla, porque en WordPress no hay traducción
 * que leer.
 *
 * Si aparece un color nuevo en Woo y no está acá, se muestra en español: es
 * un nombre que se entiende, no un error. Conviene agregarlo.
 *
 * Portugués no existe en TranslatePress (ver `i18n/translatepress.ts`): la API
 * responde en español y las categorías también se traducen con esta tabla. El
 * nombre y la descripción de cada pieza quedan en español hasta que se active
 * el idioma en WordPress.
 */

import type { Locale } from '@/lib/i18n/config'

type Translations = Partial<Record<Locale, Record<string, string>>>

/** Nombres de atributo, tal como vienen de Woo. */
const ATTRIBUTE_NAMES: Translations = {
  en: { Color: 'Colour', Talle: 'Size', Talla: 'Size' },
  pt: { Color: 'Cor', Talle: 'Tamanho', Talla: 'Tamanho' },
}

/** Categorías por slug, para los idiomas que TranslatePress no cubre. */
const CATEGORY_NAMES: Translations = {
  pt: {
    accesorios: 'Acessórios',
    lana: 'Lã',
    'pashminas-ruanas': 'Pashminas & Ruanas',
    regalos: 'Presentes',
  },
}

/** Valores de atributo: los colores del catálogo. */
const TERM_NAMES: Translations = {
  en: {
    Aguamarina: 'Aquamarine',
    Azul: 'Blue',
    Beige: 'Beige',
    'Coral naranja': 'Orange coral',
    Gris: 'Grey',
    Habano: 'Tobacco',
    Merlot: 'Merlot',
    Mostaza: 'Mustard',
    Natural: 'Natural',
    Negro: 'Black',
    Rojo: 'Red',
    Rosa: 'Pink',
    Tostado: 'Tan',
    Verde: 'Green',
  },
  pt: {
    Aguamarina: 'Água-marinha',
    Azul: 'Azul',
    Beige: 'Bege',
    'Coral naranja': 'Coral laranja',
    Gris: 'Cinza',
    Habano: 'Havana',
    Merlot: 'Merlot',
    Mostaza: 'Mostarda',
    Natural: 'Natural',
    Negro: 'Preto',
    Rojo: 'Vermelho',
    Rosa: 'Rosa',
    Tostado: 'Caramelo',
    Verde: 'Verde',
  },
}

/** Talles de medias: "Talla M 39 al 42" → "Size M 39 to 42". */
const SIZE_PATTERN = /^Tall[ae]\s+(\S+)\s+(\d+)\s+al\s+(\d+)$/i

export function translateCategoryName(slug: string, locale: Locale): string | undefined {
  return CATEGORY_NAMES[locale]?.[slug]
}

export function translateAttributeName(name: string, locale: Locale): string {
  return ATTRIBUTE_NAMES[locale]?.[name] ?? name
}

export function translateTermName(name: string, locale: Locale): string {
  const direct = TERM_NAMES[locale]?.[name]
  if (direct) return direct
  const size = SIZE_PATTERN.exec(name)
  if (size && locale === 'en') return `Size ${size[1]} ${size[2]} to ${size[3]}`
  if (size && locale === 'pt') return `Tamanho ${size[1]} ${size[2]} a ${size[3]}`
  return name
}
