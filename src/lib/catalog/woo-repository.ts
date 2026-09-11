import 'server-only'

/**
 * Catálogo leído de la Store API pública de WooCommerce.
 *
 * ¿Por qué existe, si D-010 dice que el catálogo sale de Dolibarr? Porque **el
 * Woo de producción ya está sincronizado con el ERP**: los precios, las
 * categorías y —verificado el 05-09-2026— el stock por unidad salen de ahí.
 * Leer de Woo hoy es leer de Dolibarr por un camino más corto, y permite tener
 * la tienda nueva con catálogo real sin esperar al servicio de integración.
 *
 * Lo que este origen **no** tiene, y por eso es de transición:
 *   · artesana, técnica y horas de tejido — extrafields de Dolibarr (Ola 1);
 *   · composición y medidas más allá de lo que diga la descripción corta;
 *   · el estado por variante: la Store API expone el stock del padre, no el de
 *     cada color.
 *
 * Cuando exista el servicio de integración se cambia `CATALOG_SOURCE` y las
 * páginas no se enteran.
 *
 * Verificado contra `https://ruralanas.com/wp-json/wc/store/v1` el 05-09-2026:
 * 18 productos, USD con `currency_minor_unit: 0`, once variables por color.
 */

import type { CatalogRepository } from './repository'
import { decodeEntities, humanizeName, stripTags } from './woo-text'
import type {
  Artisan,
  CategoryFacet,
  CategoryRef,
  Money,
  Product,
  ProductImage,
  ProductQuery,
  ProductSummary,
  ProductVariant,
} from './types'
import type { Locale } from '@/lib/i18n/config'

export const WOO_CATALOG_TAG = 'catalog'

// ── Formas de la Store API ───────────────────────────────────────────────────

interface WooPrices {
  price: string
  regular_price: string
  sale_price: string
  currency_code: string
  currency_minor_unit: number
}

interface WooTerm {
  id: number
  name: string
  slug: string
}

interface WooAttribute {
  id: number
  name: string
  taxonomy: string | null
  has_variations: boolean
  terms: WooTerm[]
}

interface WooImage {
  id: number
  src: string
  thumbnail?: string
  alt?: string
  name?: string
}

interface WooCategory {
  id: number
  name: string
  slug: string
  count?: number
}

interface WooProduct {
  id: number
  name: string
  slug: string
  type: string
  sku: string
  short_description: string
  description: string
  on_sale: boolean
  prices: WooPrices
  images: WooImage[]
  categories: WooCategory[]
  attributes: WooAttribute[]
  variations: { id: number; attributes: { name: string; value: string }[] }[]
  has_options: boolean
  is_purchasable: boolean
  is_in_stock: boolean
  low_stock_remaining: number | null
}

// ── Utilidades de texto ──────────────────────────────────────────────────────

function money(prices: WooPrices, raw: string): Money {
  const parsed = Number.parseInt(raw, 10)
  const amount = Number.isNaN(parsed) ? 0 : parsed / 10 ** prices.currency_minor_unit
  const code = prices.currency_code?.toUpperCase()
  const currency = code === 'UYU' || code === 'ARS' || code === 'EUR' ? code : 'USD'
  return { amount, currency }
}

/**
 * La descripción corta de Woo mezcla resumen, composición y medidas en
 * párrafos sueltos. Se separan por lo que dice cada línea; lo que no se
 * reconoce queda como resumen, que es la lectura conservadora.
 */
function splitDescription(shortDescription: string): {
  summary: string
  composition?: string
  measurements?: string
} {
  const lines = stripTags(shortDescription)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const rest: string[] = []
  let composition: string | undefined
  let measurements: string | undefined

  for (const line of lines) {
    if (!measurements && /^medidas?\s*:/i.test(line)) {
      measurements = line.replace(/^medidas?\s*:\s*/i, '')
    } else if (!composition && /^\s*\d+\s*%|lana merino/i.test(line) && line.length < 80) {
      composition = line
    } else {
      rest.push(line)
    }
  }

  return { summary: rest.join(' '), composition, measurements }
}

// ── Mapeos de dominio ────────────────────────────────────────────────────────

/** Orden de preferencia para elegir la categoría que se muestra. "Regalos" es
 *  transversal: casi todo está ahí y no dice nada del producto. */
const CATEGORY_PRIORITY = ['pashminas-ruanas', 'deco', 'accesorios', 'lana', 'regalos']

function toCategoryRef(category: WooCategory): CategoryRef {
  return { id: String(category.id), slug: category.slug, name: decodeEntities(category.name) }
}

function primaryCategory(categories: WooCategory[]): CategoryRef {
  const sorted = [...categories].sort((a, b) => {
    const rank = (slug: string) => {
      const index = CATEGORY_PRIORITY.indexOf(slug)
      return index === -1 ? CATEGORY_PRIORITY.length : index
    }
    return rank(a.slug) - rank(b.slug)
  })
  return sorted[0]
    ? toCategoryRef(sorted[0])
    : { id: '0', slug: 'sin-categoria', name: 'Catálogo' }
}

function toImages(product: WooProduct, name: string): ProductImage[] {
  return product.images.map((image, index) => ({
    src: image.src,
    alt: decodeEntities(image.alt || '') || name,
    // La Store API no clasifica las fotos. La primera es la de producto; el
    // resto se ofrece como uso, que es lo que suele haber cargado.
    kind: index === 0 ? 'product' : 'lifestyle',
  }))
}

function toAvailability(product: WooProduct): ProductSummary['availability'] {
  if (!product.is_in_stock || !product.is_purchasable) {
    return { state: 'sold_out', units: 0 }
  }
  // `low_stock_remaining` sólo viene cuando el stock bajó del umbral de Woo.
  // Es la única vía por la que la Store API deja ver unidades exactas, y es
  // justo la que necesitamos para poder decir "queda 1".
  const left = product.low_stock_remaining
  if (left === 1) return { state: 'last_one', units: 1 }
  if (typeof left === 'number' && left > 0) return { state: 'in_stock', units: left }
  return { state: 'in_stock', units: 99 }
}

function colorOf(product: WooProduct): { name: string; terms: WooTerm[]; attribute: string } {
  const attribute =
    product.attributes.find((item) => item.taxonomy === 'pa_color') ??
    product.attributes.find((item) => /color/i.test(item.name))

  return {
    name: attribute?.terms?.[0] ? decodeEntities(attribute.terms[0].name) : '',
    terms: attribute?.terms ?? [],
    attribute: attribute?.name ?? 'Color',
  }
}

function toVariants(product: WooProduct): ProductVariant[] {
  const { terms, attribute } = colorOf(product)
  const bySlug = new Map(terms.map((term) => [term.slug, term]))

  return product.variations.map((variation) => {
    const value = variation.attributes[0]?.value ?? ''
    const term = bySlug.get(value)
    return {
      commerceId: String(variation.id),
      colorName: term ? decodeEntities(term.name) : value,
      colorSlug: value,
      attribute: variation.attributes[0]?.name ?? attribute,
      value,
    }
  })
}

function toSummary(product: WooProduct): ProductSummary {
  const name = humanizeName(product.name)
  const images = toImages(product, name)
  const hasVariants = product.variations.length > 0

  return {
    id: String(product.id),
    commerceId: String(product.id),
    sku: product.sku,
    slug: product.slug,
    name,
    category: primaryCategory(product.categories),
    categories: product.categories.map(toCategoryRef),
    hasVariants,
    price: money(product.prices, product.prices.price),
    compareAtPrice: product.on_sale
      ? money(product.prices, product.prices.regular_price)
      : undefined,
    image: images[0] ?? { src: '', alt: name, kind: 'product' },
    availability: toAvailability(product),
    // Woo no modela la técnica de tejido. Llega con Dolibarr (Ola 1, tarea 1).
    technique: undefined,
    colorName: colorOf(product).name,
    featured: false,
  }
}

const SHIPPING = {
  es: { from: 'Uruguay', estimate: 'Envío internacional, 7 a 14 días hábiles' },
  en: { from: 'Uruguay', estimate: 'International shipping, 7 to 14 business days' },
} as const

const CARE = {
  es: [
    'Lavar a mano en agua fría con jabón neutro.',
    'No retorcer: presionar para quitar el agua.',
    'Secar en plano, a la sombra.',
    'Guardar doblada, nunca colgada.',
  ],
  en: [
    'Hand wash in cold water with mild soap.',
    'Do not wring: press to remove water.',
    'Dry flat, away from direct sun.',
    'Store folded, never hanging.',
  ],
} as const

function toProduct(product: WooProduct, locale: Locale, all: WooProduct[]): Product {
  const summary = toSummary(product)
  const name = summary.name
  const parts = splitDescription(product.short_description)
  const long = stripTags(product.description)

  const related = all
    .filter(
      (item) =>
        item.id !== product.id &&
        item.categories.some((category) =>
          product.categories.some((own) => own.slug === category.slug),
        ),
    )
    .slice(0, 4)
    .map((item) => item.slug)

  return {
    ...summary,
    images: toImages(product, name),
    summary: parts.summary || name,
    story: long || parts.summary || '',
    composition: parts.composition ?? (locale === 'es' ? '100% lana merino' : '100% merino wool'),
    measurements: parts.measurements ?? (locale === 'es' ? 'Consultar' : 'On request'),
    care: [...CARE[locale]],
    // Sin artesana: la ficha esconde el bloque. Ver el comentario del tipo.
    artisan: undefined,
    variants: toVariants(product),
    shipping: { ...SHIPPING[locale] },
    relatedSlugs: related,
  }
}

// ── Acceso a la API ──────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = process.env.WOO_STORE_API_URL
  if (!url) {
    throw new Error('WOO_STORE_API_URL no está configurada. Con CATALOG_SOURCE=woo es obligatoria.')
  }
  return url.replace(/\/$/, '')
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    headers: { accept: 'application/json' },
    // El stock cambia cuando cambia en el ERP. Cinco minutos es el compromiso
    // entre no vender lo que no hay y no pegarle a WordPress en cada visita;
    // el sync puede invalidar antes por /api/revalidate.
    next: { revalidate: 300, tags: [WOO_CATALOG_TAG] },
  })

  if (!response.ok) {
    throw new Error(`Catálogo Woo: ${response.status} en ${path}`)
  }

  return (await response.json()) as T
}

/**
 * El catálogo entero en una sola llamada. Con dieciocho productos filtrar en
 * memoria es más simple y más rápido que traducir cada filtro a la Store API,
 * y da resultados idénticos al mock. Revisar si el catálogo pasa de ~200.
 */
function allProducts(): Promise<WooProduct[]> {
  return request<WooProduct[]>('/products?per_page=100&catalog_visibility=catalog')
}

function matches(product: WooProduct, query: ProductQuery): boolean {
  if (query.category && !product.categories.some((item) => item.slug === query.category)) {
    return false
  }
  // La técnica todavía no existe en Woo: si se filtra por ella no hay nada que
  // ofrecer, y decirlo con una grilla vacía es más honesto que ignorar el filtro.
  if (query.techniques?.length) return false
  if (query.onlyAvailable && !product.is_in_stock) return false

  if (query.search) {
    const needle = query.search.toLocaleLowerCase('es')
    const haystack = `${product.name} ${product.sku} ${stripTags(product.short_description)}`
    if (!haystack.toLocaleLowerCase('es').includes(needle)) return false
  }

  return true
}

export const wooCatalogRepository: CatalogRepository = {
  async listProducts(query: ProductQuery): Promise<ProductSummary[]> {
    const products = (await allProducts()).filter((product) => matches(product, query))
    const summaries = products.map(toSummary)

    switch (query.sort) {
      case 'price-asc':
        summaries.sort((a, b) => a.price.amount - b.price.amount)
        break
      case 'price-desc':
        summaries.sort((a, b) => b.price.amount - a.price.amount)
        break
      default:
        // Sin campo de destacados en Woo: lo disponible primero, y dentro de
        // eso lo de mayor valor, que es lo que conviene mostrar arriba.
        summaries.sort((a, b) => {
          const rank = (item: ProductSummary) => (item.availability.state === 'sold_out' ? 1 : 0)
          return rank(a) - rank(b) || b.price.amount - a.price.amount
        })
    }

    return query.limit ? summaries.slice(0, query.limit) : summaries
  },

  async getProduct(slug: string, locale: Locale): Promise<Product | null> {
    const products = await allProducts()
    const found = products.find((product) => product.slug === slug)
    return found ? toProduct(found, locale, products) : null
  },

  async listProductSlugs(): Promise<string[]> {
    return (await allProducts()).map((product) => product.slug)
  },

  async listCategories(): Promise<CategoryFacet[]> {
    const products = await allProducts()
    const counts = new Map<string, CategoryFacet>()

    for (const product of products) {
      for (const category of product.categories) {
        const ref = toCategoryRef(category)
        const current = counts.get(ref.slug)
        counts.set(ref.slug, { ...ref, count: (current?.count ?? 0) + 1 })
      }
    }

    return [...counts.values()].sort(
      (a, b) => CATEGORY_PRIORITY.indexOf(a.slug) - CATEGORY_PRIORITY.indexOf(b.slug),
    )
  },

  async listArtisans(): Promise<Artisan[]> {
    // No están en Woo. La página de artesanas espera al ERP y al consentimiento.
    return []
  },
}
