import type { Metadata } from 'next'

import { AdminLogin } from '@/components/admin/admin-login'
import { adminEnabled } from '@/lib/admin/session'
import { resolveLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/** Herramienta interna: fuera del índice y fuera de los sitemaps. */
export const metadata: Metadata = {
  title: 'Ingresar · Admin',
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Única puerta de entrada al admin. Todo lo demás del admin redirige acá si no
 * hay sesión (lo hace el middleware). Con sesión, esta página lleva al panel.
 */
export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ volver?: string | string[] }>
}) {
  const locale = resolveLocale((await params).locale)
  const requested = (await searchParams).volver
  const back = typeof requested === 'string' ? requested : undefined
  // Sólo se vuelve a una página del admin de este sitio: nunca a otra dirección.
  const target =
    back && back.startsWith(`/${locale}/admin/`) && !back.startsWith('//') ? back : `/${locale}/admin`

  return (
    <div className="flex min-h-screen items-center justify-center bg-shell px-[var(--spacing-gutter)] pt-[100px] pb-20 text-earth">
      <AdminLogin enabled={adminEnabled()} target={target} />
    </div>
  )
}
