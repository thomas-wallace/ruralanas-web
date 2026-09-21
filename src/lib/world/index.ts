/**
 * Puerto del alcance en el mundo.
 *
 * El componente del mapa lee por acá y por ningún otro lado. Hoy contesta el
 * origen `manual` —`src/content/world-reach.ts`—; mañana contestará el servicio
 * de integración con los pedidos reales de Dolibarr, y el mapa no se entera.
 *
 * Mismo patrón que el catálogo (`src/lib/catalog/index.ts`): puerto, orígenes
 * intercambiables y una variable de entorno que elige cuál.
 */

import { worldReachContent } from '@/content/world-reach'
import { COUNTRY_PATHS } from './geometry'
import type { ReachCountry, WorldReach } from './types'

const source = process.env.WORLD_REACH_SOURCE ?? 'manual'

/**
 * Un país declarado que no tiene polígono ni nodo queda invisible en el mapa:
 * el envío existió pero nadie lo ve. Avisamos en desarrollo, donde alguien lo
 * puede arreglar, y callamos en producción, donde sólo sería ruido.
 */
function avisarInvisibles(countries: ReachCountry[]): void {
  if (process.env.NODE_ENV === 'production') return

  const invisibles = countries.filter((país) => !COUNTRY_PATHS[país.code] && !país.node)
  if (!invisibles.length) return

  console.warn(
    `[world-reach] Sin polígono a esta resolución y sin nodo, no se dibujan: ${invisibles
      .map((país) => país.code)
      .join(', ')}. Agregá sus coordenadas en shippedNodes.`,
  )
}

function fromContent(): WorldReach {
  const stores: ReachCountry[] = worldReachContent.stores.map((store) => ({
    code: store.code,
    status: 'store',
    node: { lat: store.lat, lon: store.lon, label: store.city },
  }))

  const conNodo = new Map(worldReachContent.shippedNodes.map((nodo) => [nodo.code, nodo]))
  const conLocal = new Set(stores.map((store) => store.code))

  const shipped: ReachCountry[] = worldReachContent.shipped
    // Un país con local ya está contado como alcanzado: no se duplica.
    .filter((code) => !conLocal.has(code))
    .map((code) => {
      const nodo = conNodo.get(code)
      return {
        code,
        status: 'shipped',
        ...(nodo ? { node: { lat: nodo.lat, lon: nodo.lon } } : {}),
      }
    })

  const countries = [...stores, ...shipped]
  avisarInvisibles(countries)

  return {
    countries,
    reachedCount: countries.length,
    asOf: worldReachContent.asOf,
  }
}

const manual = async (): Promise<WorldReach> => fromContent()

const SOURCES: Record<string, () => Promise<WorldReach>> = { manual }

/**
 * Devuelve una promesa aunque el origen manual sea síncrono: cuando el dato
 * venga del servicio de integración va a ser una llamada de red, y no queremos
 * cambiar la firma —ni los componentes— ese día.
 */
export function getWorldReach(): Promise<WorldReach> {
  return (SOURCES[source] ?? manual)()
}

/** Qué origen quedó activo. Útil para diagnóstico. */
export const worldReachSource = source in SOURCES ? source : 'manual'

export type * from './types'
