import 'server-only'

/**
 * Traducción `sku` (Dolibarr) → identificador de WooCommerce.
 *
 * Es la pieza nueva que introduce la decisión D-010: el catálogo sale del ERP
 * y el carrito vive en Woo, así que en el medio hace falta un diccionario. Su
 * casa definitiva es el servicio de integración —que ya conoce las dos
 * puntas—, pero mientras no exista se resuelve preguntándole a la propia
 * Store API por el SKU. Se elige con `SKU_MAP_SOURCE`.
 *
 * Un SKU sin equivalente **no es un error técnico**: significa que la
 * sincronización Dolibarr → Woo se quedó atrás. Por eso sale como
 * `unknown_sku` y llega a la pantalla como una frase entendible, tal como pide
 * `01-web/checkout.md`.
 */

import { CommerceError } from '../errors'
import { wooRequest, type WooCredentials } from './client'

export interface WooProductRef {
  id: number
  /** Vacío en productos simples. Woo lo pide para las variantes. */
  variation: { attribute: string; value: string }[]
}

interface CacheEntry {
  ref: WooProductRef
  expiresAt: number
}

/**
 * Caché en memoria del proceso. Es deliberadamente simple: el mapa cambia sólo
 * cuando se dan de alta productos, y una entrada vieja se nota enseguida
 * porque el add-to-cart falla. Si el storefront pasa a varias instancias, esto
 * se muda al servicio de integración junto con el resto del mapa.
 */
const cache = new Map<string, CacheEntry>()
const TTL_MS = 10 * 60 * 1000

function fromCache(sku: string): WooProductRef | null {
  const hit = cache.get(sku)
  if (!hit) return null
  if (hit.expiresAt < Date.now()) {
    cache.delete(sku)
    return null
  }
  return hit.ref
}

function remember(sku: string, ref: WooProductRef): WooProductRef {
  cache.set(sku, { ref, expiresAt: Date.now() + TTL_MS })
  return ref
}

/** Se exporta para poder invalidar desde /api/revalidate tras un sync. */
export function forgetSkuMap(): void {
  cache.clear()
}

interface WooProduct {
  id: number
  sku: string
  type: string
  name: string
}

/** Resolución contra la Store API: sirve hoy, sin backend propio. */
async function resolveViaStoreApi(
  sku: string,
  credentials: WooCredentials,
): Promise<WooProductRef> {
  // `?sku=` es el camino directo; `?search=` es la red por si la instalación
  // corre una versión de la Store API que no filtra por SKU.
  const attempts = [`/products?sku=${encodeURIComponent(sku)}`, `/products?search=${encodeURIComponent(sku)}`]

  for (const path of attempts) {
    const { data } = await wooRequest<WooProduct[]>({ path, credentials })
    if (!Array.isArray(data)) continue

    const exact = data.find((product) => product.sku === sku)
    if (!exact) continue

    if (exact.type === 'variable') {
      throw new CommerceError(
        'unknown_sku',
        'Esta pieza todavía no está publicada como comprable.',
        `El SKU ${sku} corresponde a un producto variable en Woo: el mapa de variantes vive en el servicio de integración.`,
      )
    }

    return remember(sku, { id: exact.id, variation: [] })
  }

  throw new CommerceError(
    'unknown_sku',
    'Esta pieza todavía no está publicada como comprable.',
    `Sin producto en Woo con SKU ${sku}. Revisar la sincronización Dolibarr → Woo.`,
  )
}

/** Resolución contra el servicio de integración, cuando exista. */
async function resolveViaIntegration(sku: string): Promise<WooProductRef> {
  const base = process.env.INTEGRATION_API_URL
  if (!base) {
    throw new CommerceError(
      'unavailable',
      'El motor de compra no está configurado.',
      'SKU_MAP_SOURCE=integration sin INTEGRATION_API_URL',
    )
  }

  const token = process.env.INTEGRATION_API_TOKEN
  const response = await fetch(
    `${base.replace(/\/$/, '')}/commerce/sku-map/${encodeURIComponent(sku)}`,
    {
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 600, tags: ['sku-map'] },
    },
  )

  if (response.status === 404) {
    throw new CommerceError(
      'unknown_sku',
      'Esta pieza todavía no está publicada como comprable.',
      `El servicio de integración no conoce el SKU ${sku}.`,
    )
  }
  if (!response.ok) {
    throw new CommerceError('upstream', 'No se pudo resolver la pieza.', `sku-map ${response.status}`)
  }

  const payload = (await response.json()) as { wooId: number; variation?: WooProductRef['variation'] }
  return remember(sku, { id: payload.wooId, variation: payload.variation ?? [] })
}

export async function resolveSku(
  sku: string,
  credentials: WooCredentials,
): Promise<WooProductRef> {
  const cached = fromCache(sku)
  if (cached) return cached

  return process.env.SKU_MAP_SOURCE === 'integration'
    ? resolveViaIntegration(sku)
    : resolveViaStoreApi(sku, credentials)
}
