import type { Locale } from '@/lib/i18n/config'

export interface BlogImage {
  src: string
  alt: string
  width: number
  height: number
}

export interface BlogCategory {
  slug: string
  name: string
  count: number
}

/** Lo que necesita una tarjeta del listado. */
export interface PostSummary {
  slug: string
  title: string
  /** Texto plano, sin HTML. */
  excerpt: string
  /** ISO 8601. */
  publishedAt: string
  updatedAt: string
  image: BlogImage | null
  categories: BlogCategory[]
  /** Idioma en que está escrito. Hoy WordPress publica sólo en español. */
  language: Locale
  readingMinutes: number
}

export interface Post extends PostSummary {
  /** HTML ya saneado: se puede insertar tal cual. */
  html: string
}

export interface PostQuery {
  locale: Locale
  page?: number
  perPage?: number
  category?: string
}

export interface PostPage {
  posts: PostSummary[]
  total: number
  totalPages: number
  page: number
}
