/**
 * Puerto del blog.
 *
 * Las páginas leen las noticias por esta interfaz y por ninguna otra vía. Hoy
 * la implementa WordPress, donde la empresa ya publica; si mañana el contenido
 * pasa a otro CMS, se escribe otro repositorio y las páginas no se enteran.
 */

import type { BlogCategory, Post, PostPage, PostQuery } from './types'
import type { Locale } from '@/lib/i18n/config'

export interface BlogRepository {
  listPosts(query: PostQuery): Promise<PostPage>
  getPost(slug: string, locale: Locale): Promise<Post | null>
  /** Sólo las categorías que sirven para filtrar: con notas y sin ser el total. */
  listCategories(locale: Locale): Promise<BlogCategory[]>
  /** Slugs para `generateStaticParams` y el sitemap. */
  listSlugs(): Promise<string[]>
}
