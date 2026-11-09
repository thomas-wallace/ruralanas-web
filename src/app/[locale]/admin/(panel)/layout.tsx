import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ADMIN_COOKIE, tokenIsValid } from '@/lib/admin/session'
import { resolveLocale } from '@/lib/i18n'

/**
 * Segunda capa de la puerta del admin: todas las páginas de este grupo
 * verifican la sesión en el servidor antes de dibujar nada. La primera es el
 * middleware; esta existe por si algún día una ruta se escapa de su `matcher`.
 */

export const dynamic = 'force-dynamic'

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const locale = resolveLocale((await params).locale)
  if (!tokenIsValid((await cookies()).get(ADMIN_COOKIE)?.value)) {
    redirect(`/${locale}/admin/ingresar`)
  }
  return children
}
