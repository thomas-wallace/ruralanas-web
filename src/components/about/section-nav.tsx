import Link from 'next/link'

import type { AboutSection } from '@/lib/about/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/**
 * Navegación entre las secciones de Nosotros. Se arma con las secciones que
 * existan: sumar una al contenido la agrega acá sola.
 */
export function SectionNav({
  sections,
  current,
  locale,
  dict,
}: {
  sections: AboutSection[]
  /** `undefined` en la portada de Nosotros. */
  current?: string
  locale: Locale
  dict: Dictionary
}) {
  const items = [
    { href: routes.about(locale), label: dict.about.overview, active: current === undefined },
    ...sections.map((section) => ({
      href: routes.about(locale, section.slug),
      label: section.eyebrow,
      active: section.slug === current,
    })),
  ]

  return (
    <nav
      aria-label={dict.about.sectionsNav}
      className="sticky top-[calc(var(--spacing-header)+1px)] z-40 border-y border-earth/10 bg-paper/92 backdrop-blur-md"
    >
      <ul className="no-scrollbar mx-auto m-0 flex max-w-[1100px] list-none gap-7 overflow-x-auto px-[var(--spacing-gutter)] py-0 md:px-0">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`block border-b-2 py-4 text-[13px] tracking-[0.04em] whitespace-nowrap transition-colors ${
                item.active
                  ? 'border-earth text-earth'
                  : 'border-transparent text-slate hover:text-earth'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
