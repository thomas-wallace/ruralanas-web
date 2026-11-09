import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin/admin-header'
import { TimelineAdmin } from '@/components/admin/timeline-admin'
import { resolveLocale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Nosotros · Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default async function AboutAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <AdminHeader
        locale={locale}
        current="nosotros"
        title="Nosotros"
        lead="La línea de tiempo de «Nuestra historia». El resto de la página Nosotros todavía se edita en el código."
      />
      <div className="mx-auto max-w-[1000px] px-[var(--spacing-gutter)]">
        <TimelineAdmin aboutUrl={routes.about(locale)} />
      </div>
    </div>
  )
}
