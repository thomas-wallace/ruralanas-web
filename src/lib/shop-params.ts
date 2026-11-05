import { COLLECTIONS, type CollectionSlug } from '@/lib/catalog/types'
import type { Locale } from '@/lib/i18n/config'

/**
 * Estado de la tienda en la URL.
 *
 * Los filtros son enlaces, no estado de React: la tienda funciona sin
 * JavaScript, cada combinación es compartible y el servidor puede renderizar
 * el listado ya filtrado. La misma decisión es la que permite que Google vea
 * las categorías.
 *
 * No hay parámetro de orden: la tienda se muestra siempre en el orden de la
 * casa, o en el de la selección elegida. Ordenar por precio se sacó a pedido.
 */

export type ShopView = 'grid' | 'list'

export interface ShopParams {
  category?: string
  /** Best Sellers, Exclusivos o Carryover. */
  collection?: CollectionSlug
  /** Texto buscado. Se busca dentro de la categoría y filtros activos. */
  q?: string
  /** Slugs de color. Se validan contra el catálogo, no acá: los define Woo. */
  colors: string[]
  view: ShopView
}

type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseShopParams(raw: RawParams): ShopParams {
  const category = first(raw.categoria)
  const collection = first(raw.seleccion)
  const view = first(raw.vista)
  // Recortado: una URL no es lugar para pegar un párrafo.
  const q = first(raw.q)?.trim().slice(0, 80)

  const colors = (first(raw.color)?.split(',') ?? [])
    .map((item) => item.trim())
    .filter((item) => /^[a-z0-9-]{1,40}$/.test(item))
    .slice(0, 20)

  return {
    category: category && category !== 'todos' ? category : undefined,
    collection: COLLECTIONS.includes(collection as CollectionSlug)
      ? (collection as CollectionSlug)
      : undefined,
    q: q || undefined,
    colors,
    view: view === 'list' ? 'list' : 'grid',
  }
}

/** Construye la URL de la tienda aplicando cambios sobre el estado actual. */
export function shopHref(
  locale: Locale,
  current: ShopParams,
  changes: Partial<ShopParams>,
): string {
  const next = { ...current, ...changes }
  const search = new URLSearchParams()

  if (next.collection) search.set('seleccion', next.collection)
  if (next.q) search.set('q', next.q)
  if (next.category) search.set('categoria', next.category)
  if (next.colors.length) search.set('color', next.colors.join(','))
  if (next.view !== 'grid') search.set('vista', next.view)

  const query = search.toString()
  return `/${locale}/tienda${query ? `?${query}` : ''}`
}

/** Alterna un color dentro del filtro múltiple. */
export function toggleColor(current: string[], color: string): string[] {
  return current.includes(color) ? current.filter((item) => item !== color) : [...current, color]
}

export function hasActiveFilters(params: ShopParams): boolean {
  return (
    Boolean(params.q) ||
    Boolean(params.category) ||
    Boolean(params.collection) ||
    params.colors.length > 0
  )
}
