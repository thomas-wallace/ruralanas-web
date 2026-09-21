import type { Metadata } from 'next'

import { CheckoutForm } from '@/components/checkout/checkout-form'
import { CheckoutHandoff } from '@/components/checkout/handoff'
import { commerce } from '@/lib/commerce'
import { getDictionary, resolveLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * El carrito viaja a Woo por la cookie de sesión, y una cookie no cruza de un
 * origen a otro. Si el storefront y WooCommerce no comparten dominio, el
 * cliente llega al checkout con el carrito vacío y el síntoma no dice por qué.
 * En desarrollo se avisa; en producción no se muestra nada, pero el problema
 * tampoco debería existir.
 */
function originMismatch(): string | null {
  const checkout = process.env.WOO_CHECKOUT_URL
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (!checkout || !site) return null
  try {
    const a = new URL(checkout).origin
    const b = new URL(site).origin
    return a === b ? null : `${b} → ${a}`
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const dict = getDictionary(resolveLocale((await params).locale))
  return { title: `${dict.checkout.title} · Ruralanas`, robots: { index: false, follow: false } }
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const dict = getDictionary(locale)

  return (
    <div className="min-h-screen bg-paper text-earth">
      <div className="bg-shell px-[var(--spacing-gutter)] pb-10 pt-[104px] text-earth">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(32px,5vw,56px)] font-medium leading-none">
            {dict.checkout.title}
          </h1>
          <p className="mt-4 mb-0 max-w-[560px] text-[15px] leading-relaxed text-slate/70">
            {dict.checkout.lead}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[var(--spacing-gutter)]">
        {/* Mientras el motor sea el de prototipo, decirlo en la pantalla. Un
            checkout que no cobra y no lo aclara es una trampa para quien lo
            prueba. */}
        {commerce.kind === 'local' && (
          <div className="mt-8 border-l-2 border-caramel bg-caramel/10 px-5 py-4">
            <p className="m-0 font-display text-[17px] text-earth">{dict.checkout.prototypeTitle}</p>
            <p className="mt-2 mb-0 max-w-[70ch] text-[14px] leading-relaxed text-slate">
              {dict.checkout.prototypeBody}
            </p>
          </div>
        )}

        {/* Con el cobro alojado en Woo no hay formulario propio: se entrega
            el carrito y la pasarela pide lo que necesita (D-017). */}
        {commerce.kind === 'woo-hosted' && process.env.NODE_ENV !== 'production' && originMismatch() && (
          <div className="mt-8 border-l-2 border-caramel bg-caramel/10 px-5 py-4">
            <p className="m-0 font-display text-[17px] text-earth">Origen distinto al de WooCommerce</p>
            <p className="mt-2 mb-0 max-w-[70ch] text-[14px] leading-relaxed text-slate">
              {originMismatch()}. La cookie de sesión del carrito no cruza entre dominios, así que
              el checkout de Woo va a abrirse vacío. Es esperable en desarrollo: se resuelve
              sirviendo el storefront desde el mismo origen que WooCommerce.
            </p>
          </div>
        )}

        {commerce.kind === 'woo-hosted' ? (
          <CheckoutHandoff locale={locale} dict={dict} />
        ) : (
          <CheckoutForm locale={locale} dict={dict} />
        )}
      </div>
    </div>
  )
}
