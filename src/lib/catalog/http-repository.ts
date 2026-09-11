/**
 * Implementación del catálogo contra el servicio de integración.
 *
 *   Dolibarr (ERP) ──> servicio de integración ──> esta web
 *
 * No se activa todavía: se enciende con `CATALOG_SOURCE=http`. Está escrita
 * ahora para que el diseño no se acople al mock y para dejar fijado el
 * contrato que el backend tiene que cumplir.
 *
 * Pendiente cuando exista el servicio:
 *   · Validar la respuesta con Zod en vez de confiar en el tipo.
 *   · Definir el manejo de error visible: hoy propaga y lo toma el error
 *     boundary de la ruta.
 */

import type { CatalogRepository } from './repository'
import type { Artisan, CategoryFacet, Product, ProductQuery, ProductSummary } from './types'
import type { Locale } from '@/lib/i18n/config'

/** Etiquetas de caché que el servicio de integración invalida vía /api/revalidate. */
export const CATALOG_TAG = 'catalog'
export const productTag = (slug: string) => `product:${slug}`

function baseUrl(): string {
  const url = process.env.INTEGRATION_API_URL
  if (!url) {
    throw new Error(
      'INTEGRATION_API_URL no está configurada. Con CATALOG_SOURCE=http es obligatoria.',
    )
  }
  return url.replace(/\/$/, '')
}

async function request<T>(path: string, tags: string[]): Promise<T> {
  const token = process.env.INTEGRATION_API_TOKEN
  const response = await fetch(`${baseUrl()}${path}`, {
    headers: {
      accept: 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    // El catálogo cambia cuando cambia el stock en el ERP. Se revalida por
    // etiqueta desde el sync; la ventana de 15 minutos es la red de seguridad.
    next: { revalidate: 900, tags },
  })

  if (!response.ok) {
    throw new Error(`Catálogo: ${response.status} en ${path}`)
  }

  return (await response.json()) as T
}

function toSearchParams(query: ProductQuery): string {
  const params = new URLSearchParams({ locale: query.locale })
  if (query.category) params.set('category', query.category)
  if (query.techniques?.length) params.set('techniques', query.techniques.join(','))
  if (query.onlyAvailable) params.set('available', '1')
  if (query.sort) params.set('sort', query.sort)
  if (query.search) params.set('q', query.search)
  if (query.limit) params.set('limit', String(query.limit))
  return params.toString()
}

export const httpCatalogRepository: CatalogRepository = {
  async listProducts(query: ProductQuery): Promise<ProductSummary[]> {
    return request<ProductSummary[]>(`/catalog/products?${toSearchParams(query)}`, [CATALOG_TAG])
  },

  async getProduct(slug: string, locale: Locale): Promise<Product | null> {
    try {
      return await request<Product>(`/catalog/products/${slug}?locale=${locale}`, [
        CATALOG_TAG,
        productTag(slug),
      ])
    } catch {
      return null
    }
  },

  async listProductSlugs(): Promise<string[]> {
    return request<string[]>('/catalog/slugs', [CATALOG_TAG])
  },

  async listCategories(locale: Locale): Promise<CategoryFacet[]> {
    return request<CategoryFacet[]>(`/catalog/categories?locale=${locale}`, [CATALOG_TAG])
  },

  async listArtisans(locale: Locale): Promise<Artisan[]> {
    return request<Artisan[]>(`/catalog/artisans?locale=${locale}`, [CATALOG_TAG])
  },
}
