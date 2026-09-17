/**
 * Modelo del contenido institucional (Nosotros y sus secciones).
 *
 * Cada página es una lista de bloques. El orden y la cantidad los decide el
 * contenido, no el componente: agregar una sección o mover un bloque no toca
 * código de interfaz.
 */

export interface ContentImage {
  src: string
  alt: string
  /** `object-position` al recortar. Por defecto, centrado. */
  position?: string
}

/** A dónde lleva un enlace. Se traduce a URL con `routes`, nunca a mano. */
export type LinkTarget =
  | { kind: 'shop'; category?: string }
  | { kind: 'about'; slug?: string }
  | { kind: 'blog' }
  | { kind: 'post'; slug: string }

export interface TitledItem {
  title: string
  text: string
}

export type ContentBlock =
  | { type: 'text'; eyebrow?: string; title?: string; paragraphs: string[] }
  | {
      type: 'split'
      eyebrow?: string
      title: string
      paragraphs: string[]
      image: ContentImage
      imageSide?: 'left' | 'right'
    }
  | { type: 'figures'; items: { value: string; label: string }[]; source?: string }
  | { type: 'steps'; eyebrow?: string; title: string; lead?: string; items: TitledItem[] }
  | { type: 'features'; eyebrow?: string; title: string; lead?: string; items: TitledItem[] }
  | {
      type: 'timeline'
      eyebrow?: string
      title: string
      items: { date: string; title: string; text: string }[]
    }
  | { type: 'quote'; text: string; source: string }
  | {
      type: 'certifications'
      eyebrow?: string
      title: string
      lead?: string
      /** Vacío = el bloque no se muestra. Nunca se inventa un sello. */
      items: { name: string; issuer: string; text: string; image?: ContentImage; url?: string }[]
    }
  /** Artesanas reales del catálogo. Si todavía no hay datos, no se muestra. */
  | { type: 'artisans'; eyebrow?: string; title: string; lead?: string }
  | { type: 'cta'; title: string; text?: string; label: string; to: LinkTarget }

export interface PageMeta {
  title: string
  description: string
}

export interface AboutSection {
  /** Parte de la URL. Es igual en todos los idiomas, como en la tienda. */
  slug: string
  meta: PageMeta
  eyebrow: string
  title: string
  lead: string
  /** Una línea para la tarjeta que lleva a la sección. */
  summary: string
  image: ContentImage
  blocks: ContentBlock[]
}

export interface AboutHub {
  meta: PageMeta
  eyebrow: string
  title: string
  lead: string
  image: ContentImage
  blocks: ContentBlock[]
  sectionsTitle: string
}

export interface AboutContent {
  hub: AboutHub
  sections: AboutSection[]
}
