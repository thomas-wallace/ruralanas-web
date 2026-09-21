import type { Metadata } from 'next'

import { CartPageBody } from '@/components/cart/cart-page-body'
import { getDictionary, resolveLocale } from '@/lib/i18n'

/** El carrito es personal: no se cachea ni se indexa. */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const dict = getDictionary(resolveLocale((await params).locale))
  return { title: `${dict.cart.title} · Ruralanas`, robots: { index: false, follow: true } }
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <div className="bg-shell px-[var(--spacing-gutter)] pb-10 pt-[104px] text-earth">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(32px,5vw,56px)] font-medium leading-none">
            {dict.cart.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)]">
        <CartPageBody locale={locale} dict={dict} />
      </div>
    </div>
  )
}
