/**
 * Modelo del alcance de Ruralanas en el mundo: a dónde llegaron las prendas y
 * dónde hay local propio.
 *
 * Hoy el dato se declara a mano en `src/content/world-reach.ts`. El destino es
 * que lo calcule el servicio de integración a partir de los pedidos de Dolibarr
 * (09-plataforma/servicio-integracion.md), sin tocar un solo componente: por eso
 * `getWorldReach()` ya devuelve una promesa y por eso existen `orders` y
 * `since`, que el origen manual deja vacíos.
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
  /** Pedidos acumulados. Vacío mientras el origen sea manual. */
  orders?: number
  /** Fecha del primer envío, ISO. Vacía mientras el origen sea manual. */
  since?: string
}

export interface WorldReach {
  countries: ReachCountry[]
  /** Cuántos países tienen envíos, locales incluidos. Es el número que se muestra. */
  reachedCount: number
  /** Fecha de relevamiento del dato, como pide la convención del repo. */
  asOf: string
}
