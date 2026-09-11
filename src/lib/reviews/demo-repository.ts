import { DEMO_REVIEWS } from './demo'
import type { ReviewsQuery, ReviewsRepository } from './repository'
import type { ReviewsPage } from './types'

/**
 * Origen de muestra. No admite `create`: estas reseñas no se guardan en
 * ningún lado, justamente para que no puedan terminar publicadas como reales.
 */
export const demoReviewsRepository: ReviewsRepository = {
  kind: 'curated',

  async list(query: ReviewsQuery): Promise<ReviewsPage> {
    let reviews = [...DEMO_REVIEWS]
    if (query.minRating) reviews = reviews.filter((item) => item.rating >= query.minRating!)

    const count = reviews.length
    const average =
      count > 0 ? reviews.reduce((total, item) => total + item.rating, 0) / count : null

    return {
      reviews: query.limit ? reviews.slice(0, query.limit) : reviews,
      summary: { average, count },
      source: 'demo',
    }
  },
}
