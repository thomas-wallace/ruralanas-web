/**
 * Punto de entrada del blog.
 *
 * Las páginas importan `blog` y nada más. Qué hay del otro lado lo decide
 * `BLOG_SOURCE`:
 *
 *   wordpress → posts publicados en WordPress (estado actual)
 *   none      → sin blog: listados vacíos, útil para trabajar sin red
 */

import type { BlogRepository } from './repository'
import { wordpressBlogRepository } from './wordpress-repository'

const emptyBlogRepository: BlogRepository = {
  listPosts: async ({ page = 1 }) => ({ posts: [], total: 0, totalPages: 0, page }),
  getPost: async () => null,
  listCategories: async () => [],
  listSlugs: async () => [],
}

const REPOSITORIES: Record<string, BlogRepository> = {
  wordpress: wordpressBlogRepository,
  none: emptyBlogRepository,
}

const source = process.env.BLOG_SOURCE ?? 'wordpress'

export const blog: BlogRepository = REPOSITORIES[source] ?? emptyBlogRepository

export { BLOG_TAG } from './wordpress-repository'
export type * from './types'
