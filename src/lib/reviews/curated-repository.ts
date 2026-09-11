import type { ReviewsRepository, ReviewsQuery } from './repository'
import type { ReviewsPage } from './types'
import { curatedReviews } from './curated'

/**
 * Origen curado: la lista escrita a mano de `curated.ts`.
 *
 * No admite escritura —no hay `create`— porque un archivo del repositorio no
 * se edita desde una página web. Para cargar reseñas desde el admin está el
 * origen `woo`.
 */
export const curatedReviewsRepository: ReviewsRepository = {
  kind: 'curated',

  async list(query: ReviewsQuery): Promise<ReviewsPage> {
    let reviews = curatedReviews()
    if (query.minRating) reviews = reviews.filter((item) => item.rating >= query.minRating!)

    const count = reviews.length
    const average =
      count > 0 ? reviews.reduce((total, item) => total + item.rating, 0) / count : null

    return {
      reviews: query.limit ? reviews.slice(0, query.limit) : reviews,
      summary: { average, count },
      source: 'curated',
    }
  },
}
