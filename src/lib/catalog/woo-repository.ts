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
import { matchesSearch } from './search'
import { BEST_SELLERS_COUNT, CURATED_COLLECTIONS } from '@/content/collections'
import { PRODUCT_COPY } from '@/content/product-copy'
import { EXTRA_PRODUCT_IMAGES, IMAGE_KIND_BY_FILENAME } from '@/content/product-media'
import { PRODUCT_PROCESS } from '@/content/product-process'
import { decodeEntities, humanizeName, stripTags } from './woo-text'
import { translateAttributeName, translateCategoryName, translateTermName } from './woo-translations'
import type {
  Artisan,
  CategoryFacet,
  CategoryRef,
  CollectionSlug,
  Money,
  Product,
  ProductImage,
  ProductQuery,
  ProductSummary,
  ProductVariant,
} from './types'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { localizeWpApiUrl } from '@/lib/i18n/translatepress'

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
    // La descripción llega traducida por TranslatePress: se reconocen las
    // etiquetas en los dos idiomas.
    if (!measurements && /^(medidas?|measurements?)\s*:/i.test(line)) {
      measurements = line.replace(/^(medidas?|measurements?)\s*:\s*/i, '')
    } else if (!composition && /\d+\s*%/.test(line) && line.length < 80) {
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

/** Nombres que el sitio muestra distinto de como están cargados en Woo. El
 *  slug no cambia: es el que usan las URLs y el filtro. Cuando la categoría se
 *  renombre en producción, esta tabla sobra. */
const CATEGORY_NAME_OVERRIDES: Record<string, string> = { deco: 'Home' }

function toCategoryRef(category: WooCategory): CategoryRef {
  const name = CATEGORY_NAME_OVERRIDES[category.slug] ?? decodeEntities(category.name)
  return { id: String(category.id), slug: category.slug, name }
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

/** Orden de la galería después de la foto principal. */
const KIND_ORDER: ProductImage['kind'][] = ['lifestyle', 'texture', 'product', 'packaging']

function kindOf(src: string): ProductImage['kind'] {
  return IMAGE_KIND_BY_FILENAME.find((item) => src.includes(item.match))?.kind ?? 'product'
}

/**
 * Las fotos de Woo más las que se suman a mano, sin repetidas y en el orden de
 * la galería: la principal, la prenda en uso, la textura, el resto y la caja.
 * La Store API no dice qué muestra cada foto: se clasifica con
 * `content/product-media.ts`.
 */
function toImages(product: WooProduct, name: string): ProductImage[] {
  const seen = new Set<string>()
  const images: ProductImage[] = []
  const add = (image: ProductImage) => {
    if (seen.has(image.src)) return
    seen.add(image.src)
    images.push(image)
  }

  product.images.forEach((image, index) =>
    add({
      src: image.src,
      alt: decodeEntities(image.alt || '') || name,
      kind: index === 0 ? 'product' : kindOf(image.src),
    }),
  )
  for (const image of EXTRA_PRODUCT_IMAGES[product.slug] ?? []) {
    add({ src: image.src, alt: name, kind: image.kind })
  }

  const [main, ...rest] = images
  rest.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
  return main ? [main, ...rest] : []
}

/** La foto de la tarjeta al pasar el mouse: la prenda en uso, o si no hay,
 *  otra toma del producto. Nunca la caja ni un detalle de textura. */
function hoverImageOf(images: ProductImage[]): ProductImage | undefined {
  const rest = images.slice(1)
  return rest.find((image) => image.kind === 'lifestyle') ?? rest.find((image) => image.kind === 'product')
}

function toAvailability(product: WooProduct): ProductSummary['availability'] {
  if (!product.is_in_stock || !product.is_purchasable) {
    return { state: 'sold_out', units: 0 }
  }
  // `low_stock_remaining` sólo viene cuando el stock bajó del umbral de Woo.
  // Es la única vía por la que la Store API deja ver unidades exactas. Stock 1
  // se informa como disponible común: la tienda no muestra "pieza única" con
  // el catálogo de Woo.
  const left = product.low_stock_remaining
  if (typeof left === 'number' && left > 0) return { state: 'in_stock', units: left }
  return { state: 'in_stock', units: 99 }
}

function colorOf(product: WooProduct): { name: string; terms: WooTerm[]; attribute: string } {
  const attribute =
    product.attributes.find((item) => item.taxonomy === 'pa_color') ??
    product.attributes.find((item) => /colou?r/i.test(item.name))

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
    hoverImage: hoverImageOf(images),
    availability: toAvailability(product),
    colors: colorOf(product).terms.map((term) => ({
      slug: term.slug,
      name: decodeEntities(term.name),
    })),
    // Woo no modela la técnica de tejido: sale de la descripción de cada pieza,
    // declarada en `content/product-process.ts`. Llega con Dolibarr (Ola 1).
    technique: PRODUCT_PROCESS[product.slug]?.technique,
    colorName: colorOf(product).name,
    featured: false,
  }
}

const SHIPPING = {
  es: { from: 'Uruguay', estimate: 'Envío internacional, 7 a 14 días hábiles' },
  en: { from: 'Uruguay', estimate: 'International shipping, 7 to 14 business days' },
  pt: { from: 'Uruguai', estimate: 'Envio internacional, de 7 a 14 dias úteis' },
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
  pt: [
    'Lavar à mão em água fria com sabão neutro.',
    'Não torcer: pressionar para tirar a água.',
    'Secar na horizontal, à sombra.',
    'Guardar dobrada, nunca pendurada.',
  ],
} as const

function toProduct(product: WooProduct, locale: Locale, all: WooProduct[]): Product {
  const summary = toSummary(product)
  const name = summary.name
  const parts = splitDescription(product.short_description)
  const long = stripTags(product.description)
  // Textos corregidos a mano mientras no se arreglen en Woo. Ver el archivo.
  const copy = PRODUCT_COPY[product.slug]?.[locale]

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
  const handwork = PRODUCT_PROCESS[product.slug]

  return {
    ...summary,
    images: toImages(product, name),
    summary: copy?.summary ?? (parts.summary || name),
    story: copy ? (copy.story ?? '') : long,
    // Vacío antes que un valor por defecto: "100% lana merino" asumido era
    // falso en la ovejita (80% merino, 20% algodón). La ficha esconde la fila.
    composition: copy?.composition ?? parts.composition ?? '',
    measurements: copy ? (copy.measurements ?? '') : (parts.measurements ?? ''),
    care: [...CARE[locale]],
    // Sin artesana: la ficha esconde el bloque. Ver el comentario del tipo.
    artisan: undefined,
    handworkHours: handwork?.hours,
    workshops: handwork?.workshops,
    variants: toVariants(product),
    shipping: { ...SHIPPING[locale] },
    relatedSlugs: related,
    lookSlugs: completeTheLook(product, all),
  }
}

/** Categorías de lo que se viste. La deco y la lana no arman un look. */
const WEARABLE_CATEGORIES = ['pashminas-ruanas', 'accesorios']
const LOOK_SIZE = 4

/**
 * "Completá el look": prendas de la otra categoría que se viste (a una ruana,
 * un gorro o una bufanda; a un gorro, una ruana o un chaleco). Primero las que
 * comparten más colores con esta, que son las que combinan seguro; después,
 * en el orden del catálogo. Sólo lo que hay en stock.
 */
function completeTheLook(product: WooProduct, all: WooProduct[]): string[] {
  const own = primaryCategory(product.categories).slug
  if (!WEARABLE_CATEGORIES.includes(own)) return []

  const colors = new Set(colorOf(product).terms.map((term) => term.slug))
  return all
    .filter((item) => {
      const category = primaryCategory(item.categories).slug
      return item.is_in_stock && category !== own && WEARABLE_CATEGORIES.includes(category)
    })
    .map((item) => ({
      slug: item.slug,
      shared: colorOf(item).terms.filter((term) => colors.has(term.slug)).length,
    }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, LOOK_SIZE)
    .map((item) => item.slug)
}

// ── Acceso a la API ──────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = process.env.WOO_STORE_API_URL
  if (!url) {
    throw new Error('WOO_STORE_API_URL no está configurada. Con CATALOG_SOURCE=woo es obligatoria.')
  }
  return url.replace(/\/$/, '')
}

async function request<T>(path: string, locale: Locale): Promise<T> {
  const response = await fetch(`${localizeWpApiUrl(baseUrl(), locale)}${path}`, {
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
async function allProducts(locale: Locale): Promise<WooProduct[]> {
  const products = request<WooProduct[]>('/products?per_page=100&catalog_visibility=catalog', locale)
  if (locale === defaultLocale) return products

  const [list, categories] = await Promise.all([
    products,
    request<WooCategory[]>('/products/categories?per_page=100', locale),
  ])
  return list.map((product) => localizeProduct(product, categories, locale))
}

/**
 * Completa lo que TranslatePress deja en español dentro de cada producto. Sólo
 * toca textos que se muestran: el `name` y el `value` de las variaciones son
 * los que Woo espera de vuelta al agregar al carrito, y no se traducen.
 */
function localizeProduct(product: WooProduct, categories: WooCategory[], locale: Locale): WooProduct {
  const names = new Map(categories.map((category) => [category.slug, category.name]))
  return {
    ...product,
    categories: product.categories.map((category) => ({
      ...category,
      name: translateCategoryName(category.slug, locale) ?? names.get(category.slug) ?? category.name,
    })),
    attributes: product.attributes.map((attribute) => ({
      ...attribute,
      name: translateAttributeName(attribute.name, locale),
      terms: attribute.terms.map((term) => ({
        ...term,
        name: translateTermName(decodeEntities(term.name), locale),
      })),
    })),
  }
}

function matches(product: WooProduct, query: ProductQuery): boolean {
  if (query.category && !product.categories.some((item) => item.slug === query.category)) {
    return false
  }
  // La técnica todavía no existe en Woo: si se filtra por ella no hay nada que
  // ofrecer, y decirlo con una grilla vacía es más honesto que ignorar el filtro.
  if (query.techniques?.length) return false
  // Mismo criterio que la etiqueta "Agotado" de la tarjeta (`toAvailability`).
  if (query.onlyAvailable && toAvailability(product).state === 'sold_out') return false
  if (query.colors?.length) {
    const own = new Set(colorOf(product).terms.map((term) => term.slug))
    if (!query.colors.some((color) => own.has(color))) return false
  }

  // Nombre, categorías y colores es lo que la gente escribe; el SKU, lo que
  // escribe el mayorista que ya tiene la lista de precios.
  if (
    query.search &&
    !matchesSearch(query.search, [
      decodeEntities(product.name),
      product.sku,
      stripTags(product.short_description),
      ...product.categories.map((category) => decodeEntities(category.name)),
      ...product.attributes.flatMap((attribute) => attribute.terms.map((term) => term.name)),
    ])
  ) {
    return false
  }

  return true
}

/**
 * Slugs de una selección, en su orden. La Store API no expone cuántas veces se
 * vendió cada pieza, pero sí ordena por eso (`popularity`, que es el
 * `total_sales` de Woo): los primeros son los más vendidos. Si algún día hay
 * menos piezas con ventas que `BEST_SELLERS_COUNT`, el resto se completa con
 * piezas sin ventas; con el catálogo de hoy no pasa.
 */
async function collectionSlugs(collection: CollectionSlug): Promise<string[]> {
  if (collection !== 'best-sellers') return [...CURATED_COLLECTIONS[collection]]

  const top = await request<Pick<WooProduct, 'slug'>[]>(
    `/products?per_page=${BEST_SELLERS_COUNT}&orderby=popularity&order=desc&catalog_visibility=catalog`,
    defaultLocale,
  )
  return top.map((product) => product.slug)
}

export const wooCatalogRepository: CatalogRepository = {
  async listProducts(query: ProductQuery): Promise<ProductSummary[]> {
    const [all, order] = await Promise.all([
      allProducts(query.locale),
      query.collection ? collectionSlugs(query.collection) : undefined,
    ])
    const products = all.filter(
      (product) => matches(product, query) && (!order || order.includes(product.slug)),
    )
    const summaries = products.map(toSummary)

    // Una selección se muestra en su propio orden: el de ventas o el elegido.
    if (order) {
      summaries.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
      return query.limit ? summaries.slice(0, query.limit) : summaries
    }

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
    const products = await allProducts(locale)
    const found = products.find((product) => product.slug === slug)
    return found ? toProduct(found, locale, products) : null
  },

  async listProductSlugs(): Promise<string[]> {
    // Los slugs son los mismos en todos los idiomas.
    return (await allProducts(defaultLocale)).map((product) => product.slug)
  },

  async listCategories(locale: Locale): Promise<CategoryFacet[]> {
    const products = await allProducts(locale)
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
