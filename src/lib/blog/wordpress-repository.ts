import 'server-only'

/**
 * Blog leído de la API REST pública de WordPress (`/wp-json/wp/v2`).
 *
 * La empresa ya publica sus noticias ahí, así que no hay un segundo lugar
 * donde cargar contenido: se escribe en el admin de WordPress y la web lo
 * muestra sola, con su propio diseño. No hace falta clave: los posts
 * publicados son públicos.
 *
 * Verificado contra `https://ruralanas.com/wp-json/wp/v2` el 17-09-2026:
 * 5 posts, todos en la categoría "Noticias", en español y maquetados con
 * Elementor. TranslatePress también traduce la API cuando se la pide bajo el
 * prefijo del idioma (`/en/wp-json/...`, verificado el 27-09-2026): título,
 * cuerpo y categorías llegan en inglés, así que cada post declara el idioma en
 * que se pidió.
 */

import type { BlogRepository } from './repository'
import { dropLeadingImage, sanitizePostHtml } from './sanitize'
import type { BlogCategory, BlogImage, Post, PostPage, PostSummary } from './types'
import { decodeEntities, stripTags } from '@/lib/catalog/woo-text'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { localizeWpApiUrl } from '@/lib/i18n/translatepress'

export const BLOG_TAG = 'blog'

// ── Formas de la API ─────────────────────────────────────────────────────────

interface WpRendered {
  rendered: string
}

interface WpTerm {
  id: number
  slug: string
  name: string
  taxonomy: string
}

interface WpMedia {
  source_url: string
  alt_text?: string
  media_details?: {
    width?: number
    height?: number
    sizes?: Record<string, { source_url: string; width: number; height: number }>
  }
}

interface WpPost {
  slug: string
  date_gmt: string
  modified_gmt: string
  title: WpRendered
  excerpt: WpRendered
  content: WpRendered
  _embedded?: {
    'wp:featuredmedia'?: WpMedia[]
    'wp:term'?: WpTerm[][]
  }
}

interface WpCategory {
  id: number
  slug: string
  name: string
  count: number
}

// ── Transporte ───────────────────────────────────────────────────────────────

function baseUrl(): string {
  const url = process.env.WP_API_URL
  if (!url) throw new Error('WP_API_URL no está configurada. Con BLOG_SOURCE=wordpress es obligatoria.')
  return url.replace(/\/$/, '')
}

function siteOrigin(): string {
  return new URL(baseUrl()).origin
}

async function request<T>(path: string, locale: Locale): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(`${localizeWpApiUrl(baseUrl(), locale)}${path}`, {
    headers: { accept: 'application/json' },
    // Una noticia no es stock: una hora de caché alcanza, y publicar puede
    // invalidar antes con POST /api/revalidate { "tags": ["blog"] }.
    next: { revalidate: 3600, tags: [BLOG_TAG] },
  })

  // WordPress responde 400 cuando se pide una página que no existe.
  if (response.status === 400) return { data: [] as T, headers: response.headers }
  if (!response.ok) throw new Error(`Blog WordPress: ${response.status} en ${path}`)

  return { data: (await response.json()) as T, headers: response.headers }
}

// ── Texto ────────────────────────────────────────────────────────────────────

/**
 * Los títulos están cargados EN MAYÚSCULAS. Se pasan a mayúscula inicial, y
 * las palabras que en el cuerpo del post aparecen siempre con mayúscula
 * —nombres propios como Ruralanas o Morosoli— la conservan.
 */
function sentenceCase(raw: string, context = ''): string {
  const text = decodeEntities(raw).trim()
  if (/[a-záéíóúñü]/.test(text)) return text

  const words = context.match(/\p{L}+/gu) ?? []
  const lower = new Set(words.filter((word) => word === word.toLocaleLowerCase('es')))
  const proper = new Set(
    words
      .filter((word) => /^\p{Lu}\p{Ll}+$/u.test(word) && !lower.has(word.toLocaleLowerCase('es')))
      .map((word) => word.toLocaleLowerCase('es')),
  )

  const lowered = text.toLocaleLowerCase('es')
  return lowered.replace(/\p{L}+/gu, (word, offset: number) => {
    if (offset === 0 || proper.has(word)) {
      return word.charAt(0).toLocaleUpperCase('es') + word.slice(1)
    }
    return word
  })
}

function plainText(html: string): string {
  return stripTags(html).replace(/\s+/g, ' ').replace(/\s*\[…\]\s*$/, '…').trim()
}

function readingMinutes(html: string): number {
  const words = plainText(html).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

// ── Mapeo ────────────────────────────────────────────────────────────────────

function toImage(post: WpPost, title: string): BlogImage | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  if (!media?.source_url) return null

  // El original, sin recortes: next/image genera los tamaños livianos.
  const best = media.media_details?.sizes?.full
  return {
    src: best?.source_url ?? media.source_url,
    alt: decodeEntities(media.alt_text ?? '') || title,
    width: best?.width ?? media.media_details?.width ?? 1200,
    height: best?.height ?? media.media_details?.height ?? 750,
  }
}

/**
 * Categorías del post. El nombre sale de la lista de categorías y no del
 * término embebido: TranslatePress traduce la lista pero deja el embebido en
 * español.
 */
function toCategories(post: WpPost, visible: Map<string, string>): BlogCategory[] {
  const terms = post._embedded?.['wp:term']?.flat() ?? []
  return terms
    .filter((term) => term.taxonomy === 'category' && visible.has(term.slug))
    .map((term) => ({
      slug: term.slug,
      name: sentenceCase(visible.get(term.slug) ?? term.name),
      count: 0,
    }))
}

function toSummary(post: WpPost, visible: Map<string, string>, locale: Locale): PostSummary {
  const context = plainText(post.content.rendered)
  const title = sentenceCase(post.title.rendered, context)
  return {
    slug: post.slug,
    title,
    excerpt: plainText(post.excerpt.rendered),
    publishedAt: `${post.date_gmt}Z`,
    updatedAt: `${post.modified_gmt}Z`,
    image: toImage(post, title),
    categories: toCategories(post, visible),
    language: locale,
    readingMinutes: readingMinutes(post.content.rendered),
  }
}

// ── Categorías ───────────────────────────────────────────────────────────────

async function allCategories(locale: Locale): Promise<WpCategory[]> {
  const { data } = await request<WpCategory[]>('/categories?per_page=100&hide_empty=true', locale)
  return data
}

/**
 * Categorías útiles para filtrar. Se descartan la de por defecto de WordPress
 * y las que contienen todas las notas ("Noticias"): filtrar por ellas no
 * cambia nada.
 */
async function filterableCategories(locale: Locale): Promise<WpCategory[]> {
  const [categories, { headers }] = await Promise.all([
    allCategories(locale),
    request<WpPost[]>('/posts?per_page=1&_fields=slug', locale),
  ])
  const total = Number(headers.get('x-wp-total') ?? 0)
  return categories.filter(
    (category) => category.slug !== 'uncategorized' && category.count > 0 && category.count < total,
  )
}

// ── Repositorio ──────────────────────────────────────────────────────────────

export const wordpressBlogRepository: BlogRepository = {
  async listPosts({ locale, page = 1, perPage = 9, category }): Promise<PostPage> {
    const categories = await filterableCategories(locale)
    const visible = new Map(categories.map((item) => [item.slug, item.name]))

    const search = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      _embed: 'wp:featuredmedia,wp:term',
    })
    if (category) {
      const match = (await allCategories(locale)).find((item) => item.slug === category)
      if (!match) return { posts: [], total: 0, totalPages: 0, page }
      search.set('categories', String(match.id))
    }

    const { data, headers } = await request<WpPost[]>(`/posts?${search}`, locale)
    return {
      posts: data.map((post) => toSummary(post, visible, locale)),
      total: Number(headers.get('x-wp-total') ?? data.length),
      totalPages: Number(headers.get('x-wp-totalpages') ?? 1),
      page,
    }
  },

  async getPost(slug, locale) {
    const [categories, { data }] = await Promise.all([
      filterableCategories(locale),
      request<WpPost[]>(
        `/posts?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term`,
        locale,
      ),
    ])
    const post = data[0]
    if (!post) return null

    const summary = toSummary(
      post,
      new Map(categories.map((item) => [item.slug, item.name])),
      locale,
    )
    const html = dropLeadingImage(sanitizePostHtml(post.content.rendered, siteOrigin()), summary.image?.src)
    return { ...summary, html } satisfies Post
  },

  async listCategories(locale) {
    return (await filterableCategories(locale)).map((category) => ({
      slug: category.slug,
      name: sentenceCase(category.name),
      count: category.count,
    }))
  },

  async listSlugs() {
    // Los slugs son los mismos en todos los idiomas.
    const { data } = await request<{ slug: string }[]>('/posts?per_page=100&_fields=slug', defaultLocale)
    return data.map((post) => post.slug)
  },
}
