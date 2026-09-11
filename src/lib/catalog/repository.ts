/**
 * Puerto del catálogo.
 *
 * Toda la web lee el catálogo por esta interfaz y por ninguna otra vía. Hoy la
 * implementa `mock-repository`; mañana la implementa `http-repository` contra
 * el servicio de integración, que a su vez lee de Dolibarr. Cambiar de origen
 * de datos no debe tocar un solo componente.
 */

import type {
  Artisan,
  CategoryFacet,
  Product,
  ProductQuery,
  ProductSummary,
} from './types'
import type { Locale } from '@/lib/i18n/config'

export interface CatalogRepository {
  listProducts(query: ProductQuery): Promise<ProductSummary[]>
  getProduct(slug: string, locale: Locale): Promise<Product | null>
  /** Slugs para `generateStaticParams`. */
  listProductSlugs(): Promise<string[]>
  listCategories(locale: Locale): Promise<CategoryFacet[]>
  listArtisans(locale: Locale): Promise<Artisan[]>
}
