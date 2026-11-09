/**
 * Modelo del alcance de Ruralanas en el mundo: a dónde llegaron las prendas y
 * dónde hay local propio.
 *
 * El dato junta la lista que se carga en el admin (`/admin/mapa`) con los
 * países de los pedidos pagados, que WordPress anota solo. Ver
 * `src/lib/world/reach-store.ts`.
 */

/** ISO 3166-1 alfa-2, el mismo código que usa el checkout. */
export type CountryCode = string

export type ReachStatus =
  /** Todavía no se despachó nada a ese país. Es el estado por omisión. */
  | 'none'
  /** Hay al menos un pedido entregado. */
  | 'shipped'
  /** Hay local propio, además de envíos. */
  | 'store'

/** Punto geográfico para dibujar un nodo sobre el mapa. */
export interface ReachPoint {
  lat: number
  lon: number
  /** Ciudad, cuando el nodo marca un local. */
  label?: string
}

export interface ReachCountry {
  code: CountryCode
  status: Exclude<ReachStatus, 'none'>
  /**
   * Nodo sobre el mapa. Se usa en dos casos: para señalar la ciudad de un local
   * y para representar países que a 110m no tienen polígono (Singapur, Malta,
   * Andorra y demás micro-estados).
   */
  node?: ReachPoint
  /** Fecha del primer pedido pagado, ISO. Vacía si el país sólo está en la lista a mano. */
  since?: string
}

export interface WorldReach {
  countries: ReachCountry[]
  /** Cuántos países tienen envíos, locales incluidos. Es el número que se muestra. */
  reachedCount: number
  /** Fecha de relevamiento del dato, como pide la convención del repo. */
  asOf: string
}
