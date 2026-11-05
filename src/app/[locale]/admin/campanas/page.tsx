import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin/admin-header'
import { CampaignsAdmin } from '@/components/admin/campaigns-admin'
import { resolveLocale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Campañas · Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default async function CampaignsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <AdminHeader
        locale={locale}
        current="campanas"
        title="Campañas"
        lead="Contenido editorial de moda: fotos y videos. Una campaña nueva es un borrador hasta que se marca como publicada."
      />
      <div className="mx-auto max-w-[1100px] px-[var(--spacing-gutter)]">
        <CampaignsAdmin campaignsUrl={routes.campaigns(locale)} />
      </div>
    </div>
  )
}
