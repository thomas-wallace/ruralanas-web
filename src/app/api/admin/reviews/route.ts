/**
 * Reseñas desde el admin.
 *
 * `GET`  devuelve todas las reseñas cargadas y el catálogo, para elegir la
 *        pieza a la que se le carga una nueva.
 * `POST` crea la reseña en WooCommerce y la publica.
 *
 * Las reseñas se guardan en WooCommerce, no acá: es el sistema que la empresa
 * ya usa y modera, y así la reseña vive junto a la pieza y al pedido. El panel
 * de WordPress puede editarla o borrarla después.
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { catalog } from '@/lib/catalog'
import { REVIEWS_TAG, reviews } from '@/lib/reviews'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
}

function localeOf(request: Request) {
  const value = new URL(request.url).searchParams.get('locale') ?? ''
  return isLocale(value) ? value : defaultLocale
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  const locale = localeOf(request)

  try {
    const [page, products] = await Promise.all([
      reviews.list({ locale }),
      catalog.listProducts({ locale }),
    ])

    return NextResponse.json({
      reviews: page.reviews,
      summary: page.summary,
      canCreate: typeof reviews.create === 'function',
      products: products
        // Sin identificador en el motor no hay a qué colgar la reseña.
        .filter((product) => product.commerceId)
        .map((product) => ({ id: product.commerceId, name: product.name })),
    })
  } catch (error) {
    console.error('[admin/reviews] GET', error)
    return NextResponse.json(
      { error: 'No se pudieron leer las reseñas de WooCommerce.' },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized()

  if (typeof reviews.create !== 'function') {
    return NextResponse.json(
      { error: 'El origen de reseñas activo no admite cargar reseñas nuevas.' },
      { status: 409 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const author = typeof body.author === 'string' ? body.author.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
  const rating = Math.round(Number(body.rating))

  const missing: string[] = []
  if (!productId) missing.push('pieza')
  if (!author) missing.push('nombre')
  if (!text) missing.push('texto')
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) missing.push('estrellas')
  if (missing.length > 0) {
    return NextResponse.json({ error: `Faltan datos: ${missing.join(', ')}.` }, { status: 400 })
  }

  // WooCommerce exige un email para la reseña. Si no se sabe el de la persona,
  // se usa uno de la casa: la reseña es de ella, el contacto es nuestro.
  const reviewerEmail =
    email || process.env.REVIEWS_FALLBACK_EMAIL || 'resenas@ruralanas.com'

  try {
    const created = await reviews.create({ productId, author, email: reviewerEmail, text, rating })
    // La home tiene la lista cacheada: sin esto, la reseña nueva tardaría
    // hasta cinco minutos en verse.
    revalidateTag(REVIEWS_TAG)
    return NextResponse.json({ review: created }, { status: 201 })
  } catch (error) {
    console.error('[admin/reviews] POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar la reseña.' },
      { status: 502 },
    )
  }
}
