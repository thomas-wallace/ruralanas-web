import 'server-only'

/**
 * Punto de entrada de las tiendas adheridas.
 *
 * Hoy lee la lista fija de `content/stockists.ts`. Cuando exista la carga
 * desde el admin, cambia sólo esta función —mismo criterio que catálogo y
 * reseñas—: la home pide `getStockists()` y no sabe de dónde salen.
 *
 * Pendiente para el admin: un lugar donde escribir. Un archivo del repositorio
 * no se edita desde una página web (ver `lib/reviews/curated-repository.ts`),
 * y los logos subidos necesitan almacenamiento propio.
 */

import { STATIC_STOCKISTS } from '@/content/stockists'
import type { Stockist } from './types'

export async function getStockists(): Promise<Stockist[]> {
  return STATIC_STOCKISTS
}

export type { Stockist } from './types'
