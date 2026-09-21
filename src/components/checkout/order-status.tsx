'use client'

/**
 * Página de gracias — paso 8 de `01-web/checkout.md`.
 *
 * Regla que no se negocia: **esta página nunca es la fuente de verdad del
 * cobro**. Consulta el estado real del pedido en el motor y lo dice tal cual
 * es. Si el cliente volvió antes que la confirmación de la pasarela, muestra
 * "pago pendiente" en vez de un "gracias por tu compra" que después haya que
 * desmentir por email. La confirmación definitiva llega por webhook al
 * servicio de integración.
 */

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { formatPrice } from '@/lib/format'
import type { OrderSummary } from '@/lib/commerce/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function OrderStatus({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const params = useSearchParams()
  const orderId = params.get('id')
  const orderKey = params.get('key')

  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [state, setState] = useState<'loading' | 'done' | 'missing'>('loading')

  useEffect(() => {
    if (!orderId || !orderKey) {
      setState('missing')
      return
    }

    let cancelled = false
    fetch(
      `/api/orders?id=${encodeURIComponent(orderId)}&key=${encodeURIComponent(orderKey)}&locale=${locale}`,
    )
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) {
          setState('missing')
          return
        }
        setOrder((await response.json()) as OrderSummary)
        setState('done')
      })
      .catch(() => {
        if (!cancelled) setState('missing')
      })

    return () => {
      cancelled = true
    }
  }, [orderId, orderKey, locale])

  if (state === 'loading') {
    return (
      <p className="py-20 text-center font-mono text-[12px] tracking-[0.12em] text-slate uppercase">
        {dict.cart.updating}
      </p>
    )
  }

  if (state === 'missing' || !order) {
    return (
      <div className="py-20 text-center">
        <p className="m-0 font-display text-[24px] text-earth">{dict.thanks.missing}</p>
        <Link
          href={`/${locale}/tienda`}
          className="mt-8 inline-block bg-earth px-8 py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive"
        >
          {dict.thanks.backToShop}
        </Link>
      </div>
    )
  }

  const statusTitle = order.simulated
    ? dict.thanks.simulatedTitle
    : order.paid
      ? dict.thanks.statusPaidTitle
      : dict.thanks.statusPendingTitle

  const statusBody = order.simulated
    ? dict.thanks.simulatedBody
    : order.paid
      ? dict.thanks.statusPaidBody
      : dict.thanks.statusPendingBody

  return (
    <div className="mx-auto max-w-[620px] py-16">
      <h1 className="m-0 font-display text-[clamp(30px,5vw,46px)] font-medium leading-tight text-earth">
        {dict.thanks.title}
      </h1>
      <p className="mt-3 mb-0 text-[16px] leading-relaxed text-slate">{dict.thanks.subtitle}</p>

      <dl className="mt-10 grid grid-cols-2 gap-y-3 border-y border-earth/15 py-5 text-[15px]">
        <dt className="m-0 font-mono text-[11px] tracking-[0.1em] text-slate uppercase">
          {dict.thanks.orderNumber}
        </dt>
        <dd className="m-0 text-right font-mono text-earth">{order.orderId}</dd>
        <dt className="m-0 font-mono text-[11px] tracking-[0.1em] text-slate uppercase">
          {dict.thanks.total}
        </dt>
        <dd className="m-0 text-right font-mono text-earth">{formatPrice(order.total, locale)}</dd>
      </dl>

      <div
        className={`mt-8 border-l-2 px-5 py-4 ${
          order.simulated
            ? 'border-caramel bg-caramel/10'
            : order.paid
              ? 'border-olive bg-olive/6'
              : 'border-caramel bg-caramel/10'
        }`}
      >
        <p className="m-0 font-display text-[18px] text-earth">{statusTitle}</p>
        <p className="mt-2 mb-0 text-[14px] leading-relaxed text-slate">{statusBody}</p>
      </div>

      <Link
        href={`/${locale}/tienda`}
        className="mt-10 inline-block bg-earth px-8 py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive"
      >
        {dict.thanks.backToShop}
      </Link>
    </div>
  )
}
