import type { SortOrder, Technique } from '@/lib/catalog/types'
import type { Locale } from '@/lib/i18n/config'

/**
 * Estado de la tienda en la URL.
 *
 * Los filtros son enlaces, no estado de React: la tienda funciona sin
 * JavaScript, cada combinación es compartible y el servidor puede renderizar
 * el listado ya filtrado. La misma decisión es la que permite que Google vea
 * las categorías.
 */

export type ShopView = 'grid' | 'list'

export interface ShopParams {
  category?: string
  techniques: Technique[]
  onlyAvailable: boolean
  sort: SortOrder
  view: ShopView
}

const TECHNIQUES: Technique[] = ['telar', 'dos-agujas', 'crochet']
const SORTS: SortOrder[] = ['featured', 'price-asc', 'price-desc']

type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseShopParams(raw: RawParams): ShopParams {
  const category = first(raw.categoria)
  const techniqueValue = first(raw.tecnica)
  const sort = first(raw.orden)
  const view = first(raw.vista)

  const techniques = (techniqueValue?.split(',') ?? []).filter((item): item is Technique =>
    TECHNIQUES.includes(item as Technique),
  )

  return {
    category: category && category !== 'todos' ? category : undefined,
    techniques,
    onlyAvailable: first(raw.disponibles) === '1',
    sort: SORTS.includes(sort as SortOrder) ? (sort as SortOrder) : 'featured',
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

  if (next.category) search.set('categoria', next.category)
  if (next.techniques.length) search.set('tecnica', next.techniques.join(','))
  if (next.onlyAvailable) search.set('disponibles', '1')
  if (next.sort !== 'featured') search.set('orden', next.sort)
  if (next.view !== 'grid') search.set('vista', next.view)

  const query = search.toString()
  return `/${locale}/tienda${query ? `?${query}` : ''}`
}

/** Alterna una técnica dentro del filtro múltiple. */
export function toggleTechnique(current: Technique[], technique: Technique): Technique[] {
  return current.includes(technique)
    ? current.filter((item) => item !== technique)
    : [...current, technique]
}

export function hasActiveFilters(params: ShopParams): boolean {
  return Boolean(params.category) || params.techniques.length > 0 || params.onlyAvailable
}
