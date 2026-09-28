/** Comercio que vende piezas de Ruralanas. */
export interface Stockist {
  /** Estable: lo usará el admin para editar y borrar. */
  id: string
  name: string
  /** Ruta o URL del logo. Sin logo, la tarjeta muestra el nombre. */
  logo?: string
  city?: string
  country?: string
  /** Web o Instagram del comercio. */
  url?: string
  /** Link de Google Maps. */
  mapsUrl?: string
}
