import 'server-only'

/**
 * De dónde sale el mapa: lo cargado a mano en el admin más lo que dicen las
 * ventas.
 *
 *   · Documento `mapa-paises` del almacén de contenido: la lista a mano, los
 *     países ocultos y los locales. Mientras nadie lo guarde, es
 *     `src/content/world-reach.ts`.
 *   · Países con ventas: los anota WordPress en cada pedido pagado (plugin
 *     `wordpress/ruralanas-contenido`). Sólo existen con `CONTENT_STORE=wordpress`.
 *
 * En el mapa entra todo país de la lista o con ventas, salvo los ocultos. Por
 * eso "quitar" un país con ventas es ocultarlo: si sólo se lo sacara de la
 * lista, el próximo pedido lo volvería a poner.
 */

import { COUNTRY_NODES, worldReachContent } from '@/content/world-reach'
import {
  contentStoreKind,
  readDocument,
  wordpressConfigured,
  wordpressRequest,
  writeDocument,
} from '@/lib/content-store'

import { COUNTRY_PATHS } from './geometry'
import type { CountryCode } from './types'

const DOCUMENT = 'mapa-paises'

/** Etiqueta de caché de las ventas. El plugin la invalida al anotar un país nuevo. */
export const SALES_TAG = 'world-reach'

export interface ReachStore {
  code: CountryCode
  city: string
  lat: number
  lon: number
}

export interface ReachDocument {
  /** Países cargados a mano. */
  manual: CountryCode[]
  /** No se muestran aunque estén en la lista o tengan ventas. */
  hidden: CountryCode[]
  stores: ReachStore[]
  /** Último guardado desde el admin, ISO. */
  updatedAt: string
}

/** Primer pedido pagado a cada país. */
export type SalesByCountry = Record<CountryCode, { since: string; order?: number }>

function seed(): ReachDocument {
  return {
    manual: [...worldReachContent.shipped],
    hidden: [],
    stores: worldReachContent.stores.map((store) => ({ ...store })),
    updatedAt: `${worldReachContent.asOf}T00:00:00.000Z`,
  }
}

export async function getReachDocument(options?: { fresh?: boolean }): Promise<ReachDocument> {
  return (await readDocument<ReachDocument>(DOCUMENT, options)) ?? seed()
}

export async function saveReachDocument(document: ReachDocument): Promise<void> {
  await writeDocument(DOCUMENT, document)
}

/** ¿Las ventas se anotan solas en este despliegue? */
export const salesAvailable = () => contentStoreKind === 'wordpress' && wordpressConfigured()

/**
 * Países con ventas. Vacío si el almacén no es WordPress o si WordPress no
 * contesta: el mapa se dibuja igual con la lista a mano.
 */
export async function getSales(options?: { fresh?: boolean }): Promise<SalesByCountry> {
  if (!salesAvailable()) return {}
  try {
    const response = await wordpressRequest(
      '/ruralanas/v1/paises-ventas',
      options?.fresh ? { cache: 'no-store' } : { next: { revalidate: 3600, tags: [SALES_TAG] } },
    )
    if (!response.ok) throw new Error(`WordPress respondió ${response.status}`)
    const body = (await response.json()) as Record<string, { since?: unknown; order?: unknown }>
    const sales: SalesByCountry = {}
    for (const [code, value] of Object.entries(body ?? {})) {
      if (!isCountryCode(code) || typeof value?.since !== 'string') continue
      sales[code] = { since: value.since, ...(typeof value.order === 'number' ? { order: value.order } : {}) }
    }
    return sales
  } catch (error) {
    console.error('[world-reach] No se pudieron leer los países con ventas:', error)
    return {}
  }
}

/**
 * Recorre una página de los pedidos pagados anteriores al plugin y anota sus
 * países. El admin la llama página por página.
 */
export async function importPastSales(page: number): Promise<{ page: number; pages: number; orders: number }> {
  const response = await wordpressRequest(`/ruralanas/v1/paises-ventas/recalcular?pagina=${page}`, {
    method: 'POST',
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `WordPress respondió ${response.status}`)
  }
  const body = (await response.json()) as { pagina: number; paginas: number; pedidos: number }
  return { page: body.pagina, pages: body.paginas, orders: body.pedidos }
}

// ── Validación ───────────────────────────────────────────────────────────────

/** Un país que el mapa sabe dibujar: con polígono o con nodo. */
export const isCountryCode = (value: unknown): value is CountryCode =>
  typeof value === 'string' && /^[A-Z]{2}$/.test(value) && (value in COUNTRY_PATHS || value in COUNTRY_NODES)

function codes(input: unknown): CountryCode[] {
  return Array.isArray(input) ? [...new Set(input.filter(isCountryCode))].sort() : []
}

const coordinate = (value: unknown, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= max ? value : null

export function parseReachDocument(input: unknown): { document: ReachDocument } | { error: string } {
  const raw = (input ?? {}) as Record<string, unknown>
  if (!Array.isArray(raw.manual) || !Array.isArray(raw.hidden) || !Array.isArray(raw.stores)) {
    return { error: 'Faltan la lista de países, los ocultos o los locales.' }
  }

  const stores: ReachStore[] = []
  for (const [index, item] of (raw.stores as unknown[]).entries()) {
    const store = (item ?? {}) as Record<string, unknown>
    const city = typeof store.city === 'string' ? store.city.trim().slice(0, 60) : ''
    const lat = coordinate(store.lat, 90)
    const lon = coordinate(store.lon, 180)
    if (!isCountryCode(store.code) || !city || lat === null || lon === null) {
      return { error: `El local ${index + 1} necesita país, ciudad y coordenadas válidas.` }
    }
    stores.push({ code: store.code, city, lat, lon })
  }
  if (stores.length > 20) return { error: 'Como máximo 20 locales.' }

  return {
    document: {
      manual: codes(raw.manual),
      hidden: codes(raw.hidden),
      stores,
      updatedAt: new Date().toISOString(),
    },
  }
}
