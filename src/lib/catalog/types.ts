/**
 * Modelo de dominio del catálogo.
 *
 * Estos tipos son el contrato entre la web y el servicio de integración
 * (09-plataforma/servicio-integracion.md). El ERP —Dolibarr— es la fuente de
 * verdad; la web nunca lo consulta directamente. Cuando el servicio exista,
 * estos tipos se mueven a `packages/domain` y se comparten con el backend.
 *
 * Regla de negocio que condiciona el modelo: la oferta está limitada por
 * capacidad artesanal. `units: 1` es un caso normal y un argumento de venta,
 * no un error de datos.
 */

import type { Locale } from '@/lib/i18n/config'

export type CurrencyCode = 'USD' | 'UYU' | 'ARS' | 'EUR'

export interface Money {
  amount: number
  currency: CurrencyCode
}

/** Técnica de tejido. Es un filtro de la tienda y parte del relato del producto. */
export type Technique = 'telar' | 'dos-agujas' | 'crochet'

export type AvailabilityState =
  /** Hay más de una unidad. */
  | 'in_stock'
  /** Queda exactamente una. Se comunica como pieza única, no como escasez. */
  | 'last_one'
  /** Sin stock, pero se puede tejer a pedido con un plazo. */
  | 'made_to_order'
  /** Sin stock y sin reposición prevista: se ofrece aviso por email. */
  | 'sold_out'

export interface Availability {
  state: AvailabilityState
  units: number
  /** Días de producción cuando se teje a pedido. */
  leadTimeDays?: number
}

export interface ProductImage {
  src: string
  alt: string
  /** El módulo 08 exige las tres: producto, textura y uso. */
  kind: 'product' | 'texture' | 'lifestyle'
}

/**
 * Artesana que tejió la pieza. Es lo único del producto que nadie puede
 * copiar, así que viaja con el producto y no como dato secundario.
 * Origen futuro: extrafields de Dolibarr (Ola 1, tarea 1 del roadmap).
 */
export interface Artisan {
  id: string
  name: string
  /** Departamento o zona rural. */
  region: string
  techniques: Technique[]
  bio?: string
  portrait?: string
  /** Horas de trabajo que llevó esta pieza en particular. */
  hoursForPiece?: number
}

export interface CategoryRef {
  id: string
  slug: string
  name: string
}

/**
 * Variante comprable de una pieza. Hoy siempre es color: once de los dieciocho
 * productos publicados tienen entre seis y doce colores, y el SKU del padre no
 * se puede comprar — hay que elegir uno.
 */
export interface ProductVariant {
  /** Identificador en el motor transaccional (id de variación de Woo). */
  commerceId: string
  sku?: string
  /** Nombre legible del color, ya en el idioma del catálogo. */
  colorName: string
  colorSlug: string
  /** Atributo y valor tal como los espera el motor al añadir al carrito. */
  attribute: string
  value: string
  price?: Money
  image?: ProductImage
}

/** Lo que necesita una tarjeta de la grilla. Nada más: la ficha pide aparte. */
export interface ProductSummary {
  id: string
  /**
   * Identificador en el motor transaccional. Presente cuando el catálogo ya
   * viene del mismo sitio que cobra; ausente cuando viene del ERP, y entonces
   * el `sku` se traduce con el mapa del servicio de integración.
   */
  commerceId?: string
  sku: string
  slug: string
  name: string
  /** Categoría principal, la que se muestra. */
  category: CategoryRef
  /** Todas las categorías, para filtrar: una pieza puede ser deco y regalo. */
  categories?: CategoryRef[]
  /** `true` si hay que elegir color antes de poder comprar. */
  hasVariants?: boolean
  price: Money
  /** Precio anterior, si la pieza está rebajada. */
  compareAtPrice?: Money
  image: ProductImage
  availability: Availability
  /** Ausente en productos donde no aplica, como la madeja de lana. */
  technique?: Technique
  colorName: string
  featured: boolean
}

export interface Product extends ProductSummary {
  images: ProductImage[]
  /** Descripción corta, la que se lee al lado del precio. */
  summary: string
  /** El relato de la pieza: de dónde sale, por qué es así. */
  story: string
  composition: string
  measurements: string
  care: string[]
  /**
   * Ausente mientras el catálogo venga de WooCommerce: la trazabilidad vive en
   * los extrafields de Dolibarr (Ola 1, tarea 5) y requiere consentimiento de
   * uso del nombre. La ficha esconde el bloque en vez de inventar una artesana.
   */
  artisan?: Artisan
  /** Vacío en productos simples. */
  variants?: ProductVariant[]
  /** Estimación de envío que se muestra en la ficha, no en el checkout. */
  shipping: {
    from: string
    estimate: string
  }
  relatedSlugs: string[]
}

export interface CategoryFacet extends CategoryRef {
  count: number
}

export type SortOrder = 'featured' | 'price-asc' | 'price-desc'

export interface ProductQuery {
  locale: Locale
  /** Slug de categoría. `undefined` = todas. */
  category?: string
  techniques?: Technique[]
  /** `true` esconde lo agotado. Por defecto se muestra todo. */
  onlyAvailable?: boolean
  sort?: SortOrder
  search?: string
  limit?: number
}
