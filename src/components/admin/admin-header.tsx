import Link from 'next/link'

import type { Locale } from '@/lib/i18n/config'

/**
 * Encabezado común de las páginas del admin, con la navegación entre sus
 * secciones. Agregar una sección nueva del admin es sumar una línea acá.
 */

export const ADMIN_SECTIONS = [
  { slug: 'resenas', label: 'Reseñas' },
  { slug: 'nosotros', label: 'Nosotros' },
  { slug: 'campanas', label: 'Campañas' },
  { slug: 'mapa', label: 'Mapa' },
] as const

export type AdminSection = (typeof ADMIN_SECTIONS)[number]['slug']

export function AdminHeader({
  locale,
  current,
  title,
  lead,
}: {
  locale: Locale
  current?: AdminSection
  title: string
  lead?: string
}) {
  return (
    <div className="bg-shell px-[var(--spacing-gutter)] pb-0 pt-[120px] text-earth">
      <div className="mx-auto max-w-[1240px]">
        <div className="font-sans text-[11px] tracking-[0.2em] text-olive uppercase">Admin</div>
        <h1 className="mt-3 mb-0 font-display text-[clamp(30px,4vw,48px)] font-medium leading-none">
          {title}
        </h1>
        {lead && <p className="mt-4 mb-0 max-w-[620px] text-[15px] leading-relaxed text-slate">{lead}</p>}

        <nav aria-label="Secciones del admin" className="mt-8 flex gap-7 overflow-x-auto">
          {ADMIN_SECTIONS.map((section) => {
            const active = section.slug === current
            return (
              <Link
                key={section.slug}
                href={`/${locale}/admin/${section.slug}`}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 border-b-2 pb-3 font-sans text-[12px] tracking-[0.14em] uppercase transition-colors ${
                  active ? 'border-earth text-earth' : 'border-transparent text-slate hover:text-earth'
                }`}
              >
                {section.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
