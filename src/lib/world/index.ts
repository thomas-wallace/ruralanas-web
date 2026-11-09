import 'server-only'

/**
 * Puerto del alcance en el mundo.
 *
 * El componente del mapa lee por acá y por ningún otro lado. El dato junta la
 * lista cargada en el admin con los países de las ventas (`reach-store.ts`); el
 * mapa no sabe de dónde salió cada país.
 */

import { COUNTRY_NODES } from '@/content/world-reach'

import { COUNTRY_PATHS } from './geometry'
import { getReachDocument, getSales, type ReachDocument, type SalesByCountry } from './reach-store'
import type { ReachCountry, WorldReach } from './types'

/**
 * Un país sin polígono ni nodo queda invisible en el mapa: el envío existió
 * pero nadie lo ve. Avisamos en desarrollo, donde alguien lo puede arreglar.
 */
function avisarInvisibles(countries: ReachCountry[]): void {
  if (process.env.NODE_ENV === 'production') return
  const invisibles = countries.filter((país) => !COUNTRY_PATHS[país.code] && !país.node)
  if (!invisibles.length) return
  console.warn(
    `[world-reach] Sin polígono a esta resolución y sin nodo, no se dibujan: ${invisibles
      .map((país) => país.code)
      .join(', ')}. Agregá sus coordenadas en COUNTRY_NODES (src/content/world-reach.ts).`,
  )
}

/** Junta lista y ventas. Separado de la lectura para poder usarlo en el admin. */
export function buildWorldReach(document: ReachDocument, sales: SalesByCountry): WorldReach {
  const hidden = new Set(document.hidden)

  const stores: ReachCountry[] = document.stores.map((store) => ({
    code: store.code,
    status: 'store',
    node: { lat: store.lat, lon: store.lon, label: store.city },
    ...(sales[store.code] ? { since: sales[store.code]?.since } : {}),
  }))
  const withStore = new Set(stores.map((store) => store.code))

  const codes = new Set([...document.manual, ...Object.keys(sales)])
  const shipped: ReachCountry[] = [...codes]
    // Un país con local ya cuenta como alcanzado: no se duplica.
    .filter((code) => !withStore.has(code) && !hidden.has(code))
    .sort()
    .map((code) => {
      const node = COUNTRY_PATHS[code] ? undefined : COUNTRY_NODES[code]
      const since = sales[code]?.since
      return { code, status: 'shipped', ...(node ? { node } : {}), ...(since ? { since } : {}) }
    })

  const countries = [...stores, ...shipped]
  avisarInvisibles(countries)

  // Fecha del dato: el último guardado del admin o la última venta a un país nuevo.
  const dates = [document.updatedAt.slice(0, 10), ...Object.values(sales).map((sale) => sale.since)]
  return {
    countries,
    reachedCount: countries.length,
    asOf: dates.sort().at(-1) ?? document.updatedAt.slice(0, 10),
  }
}

export async function getWorldReach(): Promise<WorldReach> {
  const [document, sales] = await Promise.all([getReachDocument(), getSales()])
  return buildWorldReach(document, sales)
}

export type * from './types'
