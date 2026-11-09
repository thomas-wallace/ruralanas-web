import type { Metadata } from 'next'

import { AdminHeader } from '@/components/admin/admin-header'
import { NewsAdmin } from '@/components/admin/news-admin'
import { resolveLocale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Noticias · Admin',
  robots: { index: false, follow: false, nocache: true },
}

export default async function NewsAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <AdminHeader
        locale={locale}
        current="noticias"
        title="Noticias"
        lead="Se escriben en español y se publican en Noticias. El inglés lo pone TranslatePress, como hasta ahora."
      />
      <div className="mx-auto max-w-[1000px] px-[var(--spacing-gutter)]">
        <NewsAdmin blogUrl={routes.blog(locale)} postBase={routes.blog(locale)} />
      </div>
    </div>
  )
}
