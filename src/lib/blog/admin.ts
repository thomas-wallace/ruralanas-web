import 'server-only'

/**
 * Noticias desde el admin de la tienda.
 *
 * Se escriben en el mismo WordPress del que las lee la web (`wordpress-
 * repository.ts`): son entradas comunes, no un segundo almacén. La tienda entra
 * con el usuario de contenido (`CONTENT_WP_USER`), cuyo rol puede escribir,
 * publicar y mandar a la papelera noticias, y nada más (plugin
 * `wordpress/ruralanas-contenido`).
 *
 * Se escriben en español. El inglés lo sigue poniendo TranslatePress, como
 * hasta ahora.
 */

import { decodeEntities } from '@/lib/catalog/woo-text'
import { wordpressConfigured, wordpressFailure, wordpressRequest } from '@/lib/content-store'

import { sanitizeEditorHtml } from './sanitize'

export type AdminPostStatus = 'draft' | 'publish' | 'future' | 'pending' | 'private'

export interface AdminPost {
  id: number
  title: string
  excerpt: string
  /** HTML del cuerpo. En las notas armadas con Elementor es sólo una vista previa. */
  content: string
  status: AdminPostStatus
  /** Fecha de publicación en hora de Uruguay, `YYYY-MM-DDTHH:mm`. */
  date: string
  slug: string
  link: string
  categories: number[]
  featured: { id: number; url: string } | null
  /** Armada con Elementor: el texto no se puede cambiar desde acá. */
  builder: boolean
}

export interface AdminCategory {
  id: number
  name: string
}

/** Las noticias se cargan desde acá sólo si la tienda tiene el usuario de WordPress. */
export const newsAdminAvailable = () => wordpressConfigured()

interface WpEditPost {
  id: number
  date: string
  slug: string
  link: string
  status: AdminPostStatus
  title: { raw?: string; rendered: string }
  excerpt: { raw?: string; rendered: string }
  content: { raw?: string; rendered: string }
  categories: number[]
  featured_media: number
  ruralanas_builder?: boolean
  _embedded?: { 'wp:featuredmedia'?: { id: number; source_url?: string }[] }
}

function toAdminPost(post: WpEditPost): AdminPost {
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  const builder = Boolean(post.ruralanas_builder)
  return {
    id: post.id,
    title: decodeEntities(post.title.raw ?? post.title.rendered),
    excerpt: post.excerpt.raw ?? '',
    content: builder
      ? sanitizeEditorHtml(post.content.rendered)
      : sanitizeEditorHtml(post.content.raw ?? post.content.rendered),
    status: post.status,
    date: post.date.slice(0, 16),
    slug: post.slug,
    link: post.link,
    categories: post.categories ?? [],
    featured: post.featured_media && media?.source_url ? { id: post.featured_media, url: media.source_url } : null,
    builder,
  }
}

const STATUSES = 'publish,future,draft,pending,private'

export async function listAdminPosts(): Promise<AdminPost[]> {
  const response = await wordpressRequest(
    `/wp/v2/posts?context=edit&status=${STATUSES}&per_page=100&orderby=date&order=desc&_embed=wp:featuredmedia`,
    { cache: 'no-store' },
  )
  if (!response.ok) throw await wordpressFailure(response, 'leer las noticias')
  return ((await response.json()) as WpEditPost[]).map(toAdminPost)
}

async function getAdminPost(id: number): Promise<AdminPost> {
  const response = await wordpressRequest(`/wp/v2/posts/${id}?context=edit&_embed=wp:featuredmedia`, {
    cache: 'no-store',
  })
  if (!response.ok) throw await wordpressFailure(response, 'leer la noticia')
  return toAdminPost((await response.json()) as WpEditPost)
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const response = await wordpressRequest('/wp/v2/categories?per_page=100&hide_empty=false', {
    cache: 'no-store',
  })
  if (!response.ok) throw await wordpressFailure(response, 'leer las categorías')
  return ((await response.json()) as { id: number; name: string; slug: string }[])
    .filter((category) => category.slug !== 'uncategorized' && category.slug !== 'sin-categoria')
    .map((category) => ({ id: category.id, name: decodeEntities(category.name) }))
}

// ── Guardar ──────────────────────────────────────────────────────────────────

export interface PostInput {
  title: string
  excerpt: string
  /** Sin cuerpo: no se toca (notas de Elementor). */
  content?: string
  status: 'draft' | 'publish'
  date?: string
  categories: number[]
  featuredMedia: number
}

const LIMITS = { title: 200, excerpt: 600, content: 300_000 }

export function parsePostInput(raw: unknown): { input: PostInput } | { error: string } {
  const item = (raw ?? {}) as Record<string, unknown>
  const title = typeof item.title === 'string' ? item.title.trim().slice(0, LIMITS.title) : ''
  if (!title) return { error: 'La noticia necesita un título.' }

  const excerpt = typeof item.excerpt === 'string' ? item.excerpt.trim().slice(0, LIMITS.excerpt) : ''

  let content: string | undefined
  if (typeof item.content === 'string') {
    if (item.content.length > LIMITS.content) return { error: 'El texto es demasiado largo.' }
    content = sanitizeEditorHtml(item.content)
  }

  const status = item.status === 'publish' ? 'publish' : 'draft'
  if (status === 'publish' && content !== undefined && !content) {
    return { error: 'Para publicarla, la noticia necesita texto.' }
  }

  const date =
    typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.date) ? `${item.date}:00` : undefined

  const categories = Array.isArray(item.categories)
    ? [...new Set(item.categories.filter((id): id is number => Number.isInteger(id) && id > 0))].slice(0, 20)
    : []

  const featuredMedia =
    typeof item.featuredMedia === 'number' && Number.isInteger(item.featuredMedia) && item.featuredMedia > 0
      ? item.featuredMedia
      : 0

  return { input: { title, excerpt, content, status, date, categories, featuredMedia } }
}

/** Crea (`id` vacío) o actualiza una noticia. */
export async function savePost(id: number | null, input: PostInput): Promise<AdminPost> {
  const body: Record<string, unknown> = {
    title: input.title,
    excerpt: input.excerpt,
    status: input.status,
    categories: input.categories,
    featured_media: input.featuredMedia,
  }
  if (input.content !== undefined) body.content = input.content
  // Con fecha futura y "publicar", WordPress la deja programada.
  if (input.date) body.date = input.date

  const response = await wordpressRequest(id ? `/wp/v2/posts/${id}` : '/wp/v2/posts', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw await wordpressFailure(response, 'guardar la noticia')
  const saved = (await response.json()) as { id: number }
  return getAdminPost(saved.id)
}

/** A la papelera de WordPress, no borrada: se recupera desde ahí durante 30 días. */
export async function trashPost(id: number): Promise<void> {
  const response = await wordpressRequest(`/wp/v2/posts/${id}`, { method: 'DELETE', cache: 'no-store' })
  if (!response.ok) throw await wordpressFailure(response, 'mandar la noticia a la papelera')
}
