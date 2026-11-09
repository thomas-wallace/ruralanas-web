import { redirect } from 'next/navigation'

import { resolveLocale } from '@/lib/i18n'

/** `/admin` a secas lleva a la primera sección. */
export default async function AdminIndex({ params }: { params: Promise<{ locale: string }> }) {
  redirect(`/${resolveLocale((await params).locale)}/admin/noticias`)
}
