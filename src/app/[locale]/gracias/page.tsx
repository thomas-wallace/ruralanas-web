import type { Metadata } from 'next'
import { Suspense } from 'react'

import { OrderStatus } from '@/components/checkout/order-status'
import { getDictionary, resolveLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const dict = getDictionary(resolveLocale((await params).locale))
  return { title: `${dict.thanks.title} · Ruralanas`, robots: { index: false, follow: false } }
}

export default async function ThanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)

  return (
    <div className="min-h-screen bg-paper px-[var(--spacing-gutter)] pt-[104px] text-earth">
      <div className="mx-auto max-w-[1240px]">
        <Suspense
          fallback={
            <p className="py-20 text-center font-mono text-[12px] tracking-[0.12em] text-slate uppercase">
              {dict.cart.updating}
            </p>
          }
        >
          <OrderStatus locale={locale} dict={dict} />
        </Suspense>
      </div>
    </div>
  )
}
