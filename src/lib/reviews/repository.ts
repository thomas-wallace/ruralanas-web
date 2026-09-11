/**
 * Puerto de reseñas.
 *
 * Mismo criterio que el catálogo y el motor de compra: la web lee por esta
 * interfaz y el origen lo decide una variable de entorno.
 */

import type { Review, ReviewsPage } from './types'
import type { Locale } from '@/lib/i18n/config'

export interface ReviewsQuery {
  locale: Locale
  /** Cuántas traer. La home muestra tres. */
  limit?: number
  /** Sólo las de una pieza, para la ficha de producto. */
  productId?: string
  /** Nota mínima a mostrar. Sin valor, se muestran todas. */
  minRating?: number
}

/** Lo que hace falta para crear una reseña desde el admin. */
export interface NewReview {
  productId: string
  author: string
  email: string
  text: string
  rating: number
}

export interface ReviewsRepository {
  readonly kind: 'woo' | 'curated'
  list(query: ReviewsQuery): Promise<ReviewsPage>
  /** `null` cuando el origen no admite escritura. */
  create?: (review: NewReview) => Promise<Review>
}
