import type { Metadata } from 'next'

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
    <div className="min-h-screen bg-linen-warm text-ink">
      <div className="bg-ink px-[var(--spacing-gutter)] pb-8 pt-[104px] text-linen">
        <div className="mx-auto max-w-[1240px]">
          <div className="font-mono text-[11px] tracking-[0.2em] text-bronze uppercase">Admin</div>
          <h1 className="mt-3 mb-0 font-display text-[clamp(30px,4vw,48px)] font-medium leading-none">
            Reseñas
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)]">
        <ReviewsAdmin locale={locale} />
      </div>
    </div>
  )
}
