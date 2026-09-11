/**
 * Punto de entrada del catálogo.
 *
 * Los componentes importan `catalog` y nada más. Qué hay del otro lado lo
 * decide `CATALOG_SOURCE`:
 *
 *   mock → datos declarados, para trabajar el diseño
 *   woo  → Store API de WooCommerce, que hoy ya refleja el stock de Dolibarr
 *   http → servicio de integración, cuando exista
 */

import { httpCatalogRepository } from './http-repository'
import { mockCatalogRepository } from './mock-repository'
import type { CatalogRepository } from './repository'
import { wooCatalogRepository } from './woo-repository'

const source = process.env.CATALOG_SOURCE ?? 'mock'

const REPOSITORIES: Record<string, CatalogRepository> = {
  mock: mockCatalogRepository,
  woo: wooCatalogRepository,
  http: httpCatalogRepository,
}

export const catalog: CatalogRepository = REPOSITORIES[source] ?? mockCatalogRepository

/** Qué origen quedó activo. Útil para avisos en pantalla y diagnóstico. */
export const catalogSource = source in REPOSITORIES ? source : 'mock'

export { CATALOG_TAG, productTag } from './http-repository'
export type * from './types'
