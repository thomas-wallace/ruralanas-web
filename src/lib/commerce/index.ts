import 'server-only'

/**
 * Punto de entrada del motor transaccional.
 *
 * Igual que en el catálogo: las rutas importan `commerce` y nada más. Qué hay
 * del otro lado lo decide `COMMERCE_SOURCE`:
 *
 *   local      → repositorio de prototipo, sin cobro
 *   woo        → WooCommerce headless, checkout propio (D-012)
 *   woo-hosted → carrito propio y checkout alojado en Woo (D-017)
 */

import { localCommerceRepository } from './local-repository'
import type { CommerceRepository } from './repository'
import { wooCommerceRepository, wooHostedRepository } from './woo/repository'

const REPOSITORIES: Record<string, CommerceRepository> = {
  local: localCommerceRepository,
  woo: wooCommerceRepository,
  'woo-hosted': wooHostedRepository,
}

export const commerce: CommerceRepository =
  REPOSITORIES[process.env.COMMERCE_SOURCE ?? 'local'] ?? localCommerceRepository

export { CommerceError, isCommerceError } from './errors'
export type { CommerceContext, CommerceResult, CommerceRepository } from './repository'
export type * from './types'
