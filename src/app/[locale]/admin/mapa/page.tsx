import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin/admin-header'
import { WorldReachAdmin } from '@/components/admin/world-reach-admin'
import { COUNTRY_NODES } from '@/content/world-reach'
import { resolveLocale } from '@/lib/i18n'
import { routes } from '@/lib/routes'
import { COUNTRY_PATHS } from '@/lib/world/geometry'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Mapa · Admin',
  robots: { index: false, follow: false, nocache: true },
}

/** Los países que el mapa sabe dibujar. Sólo los códigos: el dibujo no viaja al navegador. */
const DRAWABLE = [...new Set([...Object.keys(COUNTRY_PATHS), ...Object.keys(COUNTRY_NODES)])]

export default async function MapAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <AdminHeader
        locale={locale}
        current="mapa"
        title="Mapa"
        lead="«Nuestras prendas abrazan al mundo», en Nosotros. Los países con ventas se suman solos; acá se cargan los demás, se ocultan los que no van y se editan los locales."
      />
      <div className="mx-auto max-w-[1000px] px-[var(--spacing-gutter)]">
        <WorldReachAdmin mapUrl={routes.about(locale, 'en-el-mundo')} drawable={DRAWABLE} />
      </div>
    </div>
  )
}
