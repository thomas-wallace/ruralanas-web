import 'server-only'

/**
 * Punto de entrada de las reseñas.
 *
 *   woo     → guardadas en WooCommerce, cargadas desde el admin (activo)
 *   curated → la lista escrita a mano de `curated.ts`
 *
 * Con `woo`, si WordPress no responde o todavía no hay ninguna reseña, se cae
 * automáticamente a las curadas. Esa caída es deliberada: la sección tiene que
 * mostrar algo real o no mostrarse, nunca un bloque roto.
 */

import { curatedReviewsRepository } from './curated-repository'
import { demoReviewsRepository } from './demo-repository'
import type { ReviewsQuery, ReviewsRepository } from './repository'
import type { ReviewsPage } from './types'
import { wooReviewsRepository } from './woo-repository'

const requested = process.env.REVIEWS_SOURCE ?? 'woo'

/**
 * Las reseñas de muestra **no salen a producción**. Si la variable quedó
 * puesta por descuido en un despliegue, se ignora y se usan las de verdad; el
 * aviso queda en el registro del servidor para que se note.
 */
const demoBlocked = requested === 'demo' && process.env.NODE_ENV === 'production'
if (demoBlocked) {
  console.warn(
    '[reviews] REVIEWS_SOURCE=demo ignorado en producción: no se publican reseñas de muestra.',
  )
}

const source = demoBlocked ? 'woo' : requested

export const reviews: ReviewsRepository =
  source === 'demo'
    ? demoReviewsRepository
    : source === 'curated'
      ? curatedReviewsRepository
      : wooReviewsRepository

/** Lectura tolerante a fallos, que es como la usan las páginas. */
export async function listReviews(query: ReviewsQuery): Promise<ReviewsPage> {
  try {
    const page = await reviews.list(query)
    if (page.reviews.length > 0) return page
    if (source === 'demo') return page
  } catch (error) {
    console.error('[reviews] no se pudieron leer de WooCommerce', error)
  }

  return curatedReviewsRepository.list(query)
}

export { REVIEWS_TAG } from './woo-repository'
export type { ReviewsQuery, NewReview, ReviewsRepository } from './repository'
export type * from './types'
