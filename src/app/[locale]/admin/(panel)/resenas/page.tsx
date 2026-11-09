import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin/admin-header'
import { ReviewsAdmin } from '@/components/admin/reviews-admin'
import { resolveLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Reseñas · Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default async function ReviewsAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = resolveLocale((await params).locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <AdminHeader locale={locale} current="resenas" title="Reseñas" />

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)]">
        <ReviewsAdmin locale={locale} />
      </div>
    </div>
  )
}
