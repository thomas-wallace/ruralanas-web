'use client'

/**
 * Traspaso al checkout de WooCommerce (D-017).
 *
 * El carrito se armó acá; el cobro pasa del otro lado. Esta pantalla existe
 * para que ese salto sea un momento explicado y no un parpadeo raro: dice a
 * dónde va, y si el navegador bloquea la redirección deja un enlace a mano.
 *
 * Que el carrito viaje depende de que storefront y Woo compartan origen. Si
 * alguien llega acá con el carrito vacío del otro lado, es ese el síntoma.
 */

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useCart } from '@/components/cart/cart-provider'
import { cartErrorMessage } from '@/components/cart/messages'
import type { CheckoutResult } from '@/lib/commerce/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

function newKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function CheckoutHandoff({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lines, ready } = useCart()
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const started = useRef(false)

  const start = useCallback(async () => {
    try {
      const response = await fetch(`/api/checkout?locale=${locale}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: newKey() }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string }
        }
        setError(
          cartErrorMessage(dict, {
            ok: false,
            code: body.error?.code as never,
            message: body.error?.message,
          }),
        )
        return
      }

      const result = (await response.json()) as CheckoutResult
      if (!result.redirectUrl) {
        setError(dict.cart.errors.upstream)
        return
      }

      setTarget(result.redirectUrl)
      window.location.assign(result.redirectUrl)
    } catch {
      setError(dict.cart.errors.network)
    }
  }, [locale, dict])

  useEffect(() => {
    if (!ready || started.current) return
    if (lines.length === 0) return
    started.current = true
    void start()
  }, [ready, lines.length, start])

  if (ready && lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="m-0 font-display text-[24px] text-earth">{dict.cart.empty}</p>
        <Link
          href={`/${locale}/tienda`}
          className="mt-8 inline-block bg-earth px-8 py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive"
        >
          {dict.cart.continueShopping}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[560px] py-24 text-center">
      <p className="eyebrow m-0 text-slate">{dict.checkout.handoffTitle}</p>
      <p className="mx-auto mt-4 mb-0 max-w-[46ch] text-[16px] leading-relaxed text-earth">
        {dict.checkout.handoffBody}
      </p>

      {error ? (
        <>
          <p role="alert" className="mt-8 mb-0 border-l-2 border-olive bg-olive/8 px-4 py-3 text-left text-[14px] text-olive">
            {error}
          </p>
          <Link
            href={`/${locale}/carrito`}
            className="mt-6 inline-block bg-earth px-8 py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive"
          >
            {dict.checkout.backToCart}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-8 mb-0 font-mono text-[12px] tracking-[0.12em] text-slate uppercase">
            {dict.checkout.handoffWait}
          </p>
          {target && (
            <a
              href={target}
              className="mt-6 inline-block font-mono text-[11px] tracking-[0.12em] text-olive uppercase underline underline-offset-4"
            >
              {dict.checkout.handoffFallback}
            </a>
          )}
        </>
      )}
    </div>
  )
}
