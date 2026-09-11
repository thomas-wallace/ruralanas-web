import 'server-only'

/**
 * Reseñas guardadas en WooCommerce.
 *
 * **Lectura** por la Store API pública (`/products/reviews`): sin clave, sin
 * costo y sin CORS, porque la llamada sale del servidor.
 *
 * **Escritura** por la API REST v3 de WooCommerce, que sí pide clave. Es lo
 * que permite que la página de admin del storefront cargue una reseña: el
 * panel de WordPress modera y edita reseñas, pero no tiene botón para crear
 * una desde cero, así que sin esto no habría forma de cargar a mano las
 * reseñas que la gente deja por WhatsApp o en el local.
 *
 * Verificado el 05-09-2026: `GET /wp-json/wc/store/v1/products/reviews`
 * responde `[]` en la instalación, o sea que el sistema está activo y vacío.
 */

import { stripTags } from '@/lib/catalog/woo-text'
import type { NewReview, ReviewsQuery, ReviewsRepository } from './repository'
import type { Review, ReviewsPage } from './types'

interface WooReview {
  id: number
  date_created: string
  product_id: number
  product_name: string
  product_permalink: string
  product_image?: { thumbnail?: string; src?: string }
  reviewer: string
  review: string
  rating: number
  verified: boolean
  reviewer_avatar_urls?: Record<string, string>
}

function storeApiBase(): string {
  const url = process.env.WOO_STORE_API_URL
  if (!url) throw new Error('WOO_STORE_API_URL no está configurada.')
  return url.replace(/\/$/, '')
}

/** `https://sitio/wp-json/wc/store/v1` → `https://sitio/wp-json/wc/v3` */
function adminApiBase(): string {
  return storeApiBase().replace(/\/wc\/store\/v\d+$/, '/wc/v3')
}

function slugFromPermalink(permalink: string): string {
  try {
    const parts = new URL(permalink).pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] ?? ''
  } catch {
    return ''
  }
}

function toReview(raw: WooReview): Review {
  return {
    id: String(raw.id),
    author: stripTags(raw.reviewer || '').trim() || 'Anónimo',
    avatar: raw.reviewer_avatar_urls?.['96'] ?? raw.reviewer_avatar_urls?.['48'],
    text: stripTags(raw.review || ''),
    rating: Math.max(1, Math.min(5, Math.round(raw.rating))),
    publishedAt: raw.date_created,
    verified: Boolean(raw.verified),
    product: raw.product_id
      ? {
          id: String(raw.product_id),
          name: stripTags(raw.product_name || ''),
          slug: slugFromPermalink(raw.product_permalink || ''),
          image: raw.product_image?.thumbnail ?? raw.product_image?.src,
        }
      : undefined,
  }
}

async function fetchAll(productId?: string): Promise<WooReview[]> {
  const params = new URLSearchParams({ per_page: '100' })
  if (productId) params.set('product_id', productId)

  const response = await fetch(`${storeApiBase()}/products/reviews?${params}`, {
    headers: { accept: 'application/json' },
    // Una reseña nueva no puede tardar horas en aparecer, pero tampoco hace
    // falta pegarle a WordPress en cada visita. Cinco minutos, y el admin
    // invalida al publicar.
    next: { revalidate: 300, tags: ['reviews'] },
  })

  if (!response.ok) throw new Error(`Reseñas: ${response.status}`)
  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as WooReview[]) : []
}

export const REVIEWS_TAG = 'reviews'

export const wooReviewsRepository: ReviewsRepository = {
  kind: 'woo',

  async list(query: ReviewsQuery): Promise<ReviewsPage> {
    const raw = await fetchAll(query.productId)
    const all = raw.map(toReview)

    // El promedio se calcula sobre TODAS las reseñas, no sobre las que se
    // muestran: un promedio sacado de las tres mejores no es un promedio.
    const count = all.length
    const average = count > 0 ? all.reduce((total, item) => total + item.rating, 0) / count : null

    let visible = [...all].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    if (query.minRating) visible = visible.filter((item) => item.rating >= query.minRating!)

    return {
      reviews: query.limit ? visible.slice(0, query.limit) : visible,
      summary: { average, count },
      source: 'woo',
    }
  },

  async create(review: NewReview): Promise<Review> {
    const key = process.env.WOO_API_KEY
    const secret = process.env.WOO_API_SECRET
    if (!key || !secret) {
      throw new Error(
        'Faltan WOO_API_KEY y WOO_API_SECRET. Se generan en WooCommerce → Ajustes → Avanzado → API REST, con permiso de lectura/escritura.',
      )
    }

    const response = await fetch(`${adminApiBase()}/products/reviews`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Autenticación básica sobre HTTPS. Las claves NUNCA van en la URL:
        // quedarían escritas en los registros del servidor y del proxy.
        authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        product_id: Number(review.productId),
        review: review.text,
        reviewer: review.author,
        reviewer_email: review.email,
        rating: review.rating,
        status: 'approved',
      }),
      cache: 'no-store',
    })

    if (response.status === 401) {
      throw new Error(
        'WooCommerce rechazó las claves. Si son correctas, el hosting puede estar quitando la cabecera Authorization: hay que habilitarla en el servidor.',
      )
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`WooCommerce devolvió ${response.status}. ${detail.slice(0, 300)}`)
    }

    return toReview((await response.json()) as WooReview)
  },
}
