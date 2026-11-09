/**
 * Noticias desde el admin (ver `src/lib/blog/admin.ts`).
 *
 * `GET`  todas las noticias (publicadas, programadas y borradores) y las categorías.
 * `POST` crea una noticia.
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/lib/admin/session'
import { BLOG_TAG } from '@/lib/blog'
import {
  listAdminCategories,
  listAdminPosts,
  newsAdminAvailable,
  parsePostInput,
  savePost,
} from '@/lib/blog/admin'

export const dynamic = 'force-dynamic'

const unauthorized = () => NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
const unavailable = () =>
  NextResponse.json(
    { error: 'Falta conectar la tienda con WordPress (CONTENT_WP_USER y CONTENT_WP_APP_PASSWORD).' },
    { status: 503 },
  )

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  if (!newsAdminAvailable()) return NextResponse.json({ available: false, posts: [], categories: [] })
  try {
    const [posts, categories] = await Promise.all([listAdminPosts(), listAdminCategories()])
    return NextResponse.json({ available: true, posts, categories })
  } catch (error) {
    console.error('[admin/noticias] GET', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized()
  if (!newsAdminAvailable()) return unavailable()

  const parsed = parsePostInput(await request.json().catch(() => null))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const post = await savePost(null, parsed.input)
    revalidateTag(BLOG_TAG)
    return NextResponse.json({ post })
  } catch (error) {
    console.error('[admin/noticias] POST', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }
}
