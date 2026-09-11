/**
 * Modelo de las reseñas.
 *
 * Son **nuestras**, no de Google: viven en WooCommerce, que ya es el admin
 * donde la empresa entra todos los días, y se leen por su API pública. Eso
 * evita depender de una clave de terceros, de un costo por consulta y del
 * tope de cinco reseñas que impone Google.
 *
 * Cada reseña cuelga de una pieza concreta. Es a propósito: en una tienda de
 * piezas únicas, "la Ruana Clásica que me llegó" convence más que un elogio
 * suelto a la marca, y el mismo dato sirve después en la ficha de producto.
 */

export interface ReviewProduct {
  id: string
  name: string
  slug: string
  image?: string
}

export interface Review {
  id: string
  /** Nombre de quien la escribió, tal como lo dejó. */
  author: string
  /** Avatar, cuando el motor lo provee. */
  avatar?: string
  /** Texto ya limpio de HTML. */
  text: string
  /** 1 a 5. */
  rating: number
  /** Fecha ISO, para ordenar y para el `datetime` del `<time>`. */
  publishedAt: string
  /** `true` si el motor confirmó que hubo una compra detrás. */
  verified: boolean
  /** La pieza reseñada. Ausente en los testimonios curados. */
  product?: ReviewProduct
}

export interface ReviewsSummary {
  /** Promedio de estrellas, o `null` si todavía no hay reseñas. */
  average: number | null
  count: number
}

export interface ReviewsPage {
  reviews: Review[]
  summary: ReviewsSummary
  /**
   * Qué origen produjo estas reseñas. `demo` obliga a la portada a mostrar un
   * cartel: nadie tiene que poder confundir datos de muestra con clientes.
   */
  source: 'woo' | 'curated' | 'demo'
}
