/**
 * Punto de entrada del contenido institucional.
 *
 * Hoy el contenido vive en `src/content/about`, versionado junto al sitio y
 * redactado a partir de la página Nosotros de WordPress (relevada el
 * 17-09-2026). La excepción es la línea de tiempo, que se edita desde el admin
 * (`/admin/nosotros`) y se guarda en el almacén de contenido. Si mañana se carga desde un CMS, se escribe otro repositorio con
 * esta misma forma y `ABOUT_SOURCE` elige cuál usar; las páginas no cambian.
 */

import { en } from '@/content/about/en'
import { es } from '@/content/about/es'
import { pt } from '@/content/about/pt'
import { getTimeline, localizeTimeline } from './timeline'
import type { AboutContent, AboutHub, AboutSection } from './types'
import type { Locale } from '@/lib/i18n/config'

export interface AboutRepository {
  getHub(locale: Locale): Promise<AboutHub>
  listSections(locale: Locale): Promise<AboutSection[]>
  getSection(slug: string, locale: Locale): Promise<AboutSection | null>
}

const CONTENT: Record<Locale, AboutContent> = { es, en, pt }

const localAboutRepository: AboutRepository = {
  // La línea de tiempo es lo único de Nosotros que se edita desde el admin:
  // se reemplaza la del archivo por la guardada (ver `timeline.ts`).
  getHub: async (locale) => {
    const hub = CONTENT[locale].hub
    const entries = await getTimeline()
    return {
      ...hub,
      blocks: hub.blocks.map((block) =>
        block.type === 'timeline' ? localizeTimeline(block, entries, locale) : block,
      ),
    }
  },
  listSections: async (locale) => CONTENT[locale].sections,
  getSection: async (slug, locale) =>
    CONTENT[locale].sections.find((section) => section.slug === slug) ?? null,
}

const REPOSITORIES: Record<string, AboutRepository> = {
  local: localAboutRepository,
}

export const about: AboutRepository =
  REPOSITORIES[process.env.ABOUT_SOURCE ?? 'local'] ?? localAboutRepository

export type * from './types'
