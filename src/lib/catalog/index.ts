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

import { DEMO_HANDWORK_HOURS } from '@/content/demo-handwork-hours'

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

const repository = REPOSITORIES[source] ?? mockCatalogRepository

/**
 * Horas de trabajo ficticias para mostrar el bloque "Proceso" mientras las
 * reales no lleguen del ERP. Sólo completan productos que no traen el dato, y
 * sólo con `DEMO_HANDWORK_HOURS=1`. Nunca en producción.
 */
function withDemoHandworkHours(base: CatalogRepository): CatalogRepository {
  return {
    ...base,
    async getProduct(slug, locale) {
      const product = await base.getProduct(slug, locale)
      if (!product || product.handworkHours) return product
      return { ...product, handworkHours: DEMO_HANDWORK_HOURS[slug] }
    },
  }
}

export const catalog: CatalogRepository =
  process.env.DEMO_HANDWORK_HOURS === '1' ? withDemoHandworkHours(repository) : repository

/** Qué origen quedó activo. Útil para avisos en pantalla y diagnóstico. */
export const catalogSource = source in REPOSITORIES ? source : 'mock'

export { CATALOG_TAG, productTag } from './http-repository'
export type * from './types'
