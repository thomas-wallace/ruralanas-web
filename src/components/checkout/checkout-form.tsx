'use client'

/**
 * Checkout híbrido — pasos 4 a 7 de `01-web/checkout.md`.
 *
 * Todo lo que el cliente controla pasa acá dentro, con el diseño de la marca y
 * en su idioma: qué compra, a dónde va, cuánto sale el envío y qué termina
 * pagando. Sólo el acto de cobrar sale a la pasarela.
 *
 * Tres cosas que este formulario resuelve a propósito:
 *
 *   · El costo de envío aparece **antes** de pagar, apenas hay país y código
 *     postal. Es el paso que hoy no se puede hacer bien en WordPress y el que
 *     más pesa en la conversión.
 *   · El botón se bloquea y el intento lleva clave de idempotencia: un doble
 *     clic sobre una pieza única no puede generar dos pedidos.
 *   · Un pago rechazado devuelve acá con el carrito intacto, no a un carrito
 *     vacío.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { countryOptions } from './countries'
import { CartTotalsPanel } from '@/components/cart/cart-totals'
import { useCart } from '@/components/cart/cart-provider'
import { cartErrorMessage } from '@/components/cart/messages'
import { formatPrice } from '@/lib/format'
import type { CheckoutResult, PaymentMethod } from '@/lib/commerce/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string
  note: string
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  note: '',
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function CheckoutForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter()
  const { cart, lines, ready, busy, lastError, setShippingQuery, selectRate, applyCart } = useCart()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [method, setMethod] = useState('')
  const [placing, setPlacing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  /** Se mantiene entre reintentos del mismo intento de compra. */
  const idempotencyKey = useRef(newIdempotencyKey())
  const countries = useMemo(() => countryOptions(locale), [locale])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/checkout?locale=${locale}`)
      .then((response) => (response.ok ? (response.json() as Promise<PaymentMethod[]>) : []))
      .then((list) => {
        if (cancelled) return
        setMethods(list)
        setMethod((current) => current || list[0]?.id || '')
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [locale])

  const set = <K extends keyof FormState>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }))

  /** Paso 4: en cuanto hay destino, se piden tarifas. */
  const quoteShipping = useCallback(() => {
    if (!form.country) return
    void setShippingQuery({
      country: form.country,
      city: form.city,
      postcode: form.postcode,
      state: form.state,
    })
  }, [form.country, form.city, form.postcode, form.state, setShippingQuery])

  useEffect(() => {
    if (form.country) quoteShipping()
    // Sólo el país dispara la cotización automática; ciudad y código postal
    // la refinan al salir del campo, para no llamar en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country])

  const shippingChosen = cart?.shippingRates.some((rate) => rate.selected) ?? false
  const canSubmit =
    ready && lines.length > 0 && !busy && !placing && Boolean(method) &&
    (!cart?.needsShipping || shippingChosen)

  async function placeOrder(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setPlacing(true)
    setFormError(null)

    try {
      const response = await fetch(`/api/checkout?locale=${locale}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            address1: form.address1,
            address2: form.address2,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
            country: form.country,
          },
          paymentMethod: method,
          note: form.note,
          idempotencyKey: idempotencyKey.current,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string }
        }
        setFormError(
          cartErrorMessage(dict, {
            ok: false,
            code: body.error?.code as never,
            message: body.error?.message,
          }),
        )
        return
      }

      const order = (await response.json()) as CheckoutResult

      // El pedido ya existe: el próximo intento es una compra nueva.
      idempotencyKey.current = newIdempotencyKey()

      if (order.redirectUrl) {
        // La pasarela cobra en su sitio y vuelve a la página de gracias.
        window.location.assign(order.redirectUrl)
        return
      }

      applyCart({
        lines: [],
        itemCount: 0,
        totals: {
          currency: order.total.currency,
          subtotal: 0,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: 0,
          taxIncluded: false,
        },
        shippingRates: [],
        needsShipping: false,
        notices: [],
      })
      router.push(
        `/${locale}/gracias?id=${encodeURIComponent(order.orderId)}&key=${encodeURIComponent(order.orderKey)}`,
      )
    } catch {
      setFormError(dict.cart.errors.network)
    } finally {
      setPlacing(false)
    }
  }

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

  const error = formError ?? cartErrorMessage(dict, lastError)

  const field = (
    name: keyof FormState,
    label: string,
    options: { type?: string; required?: boolean; onBlur?: () => void; className?: string } = {},
  ) => (
    <label className={`flex flex-col gap-1.5 ${options.className ?? ''}`}>
      <span className="font-mono text-[11px] tracking-[0.1em] text-slate uppercase">{label}</span>
      <input
        type={options.type ?? 'text'}
        name={name}
        value={form[name]}
        onChange={set(name)}
        onBlur={options.onBlur}
        required={options.required}
        autoComplete={AUTOCOMPLETE[name]}
        className="border border-earth/25 bg-paper px-3 py-2.5 text-[15px] text-earth outline-none focus:border-olive"
      />
    </label>
  )

  return (
    <form onSubmit={placeOrder} className="grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="eyebrow m-0 text-slate">{dict.checkout.contact}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('email', dict.checkout.email, { type: 'email', required: true })}
            {field('phone', dict.checkout.phone, { type: 'tel' })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="eyebrow m-0 text-slate">{dict.checkout.address}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('firstName', dict.checkout.firstName, { required: true })}
            {field('lastName', dict.checkout.lastName, { required: true })}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.1em] text-slate uppercase">
              {dict.checkout.country}
            </span>
            <select
              name="country"
              value={form.country}
              onChange={set('country')}
              required
              autoComplete="country"
              className="border border-earth/25 bg-paper px-3 py-2.5 text-[15px] text-earth outline-none focus:border-olive"
            >
              <option value="">{dict.checkout.chooseCountry}</option>
              {countries.priority.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
              <option disabled>──────────</option>
              {countries.rest.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          {field('address1', dict.checkout.address1, { required: true })}
          {field('address2', dict.checkout.address2)}

          <div className="grid gap-4 sm:grid-cols-3">
            {field('city', dict.checkout.city, { required: true, onBlur: quoteShipping })}
            {field('state', dict.checkout.state, { onBlur: quoteShipping })}
            {field('postcode', dict.checkout.postcode, { required: true, onBlur: quoteShipping })}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="eyebrow m-0 text-slate">{dict.checkout.shippingMethod}</h2>

          {!form.country ? (
            <p className="m-0 text-[14px] text-slate">{dict.checkout.shippingHint}</p>
          ) : cart && cart.shippingRates.length === 0 ? (
            <p className="m-0 text-[14px] text-olive">{dict.checkout.noRates}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {cart?.shippingRates.map((rate) => (
                <li key={rate.id}>
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-3 transition-colors ${
                      rate.selected ? 'border-olive bg-olive/6' : 'border-earth/20 hover:border-earth/45'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping-rate"
                        value={rate.id}
                        checked={rate.selected}
                        onChange={() => void selectRate(rate.id)}
                        className="accent-earth"
                      />
                      <span className="flex flex-col">
                        <span className="text-[15px] text-earth">{rate.name}</span>
                        {rate.description && (
                          <span className="text-[13px] text-slate">{rate.description}</span>
                        )}
                      </span>
                    </span>
                    <span className="font-mono text-[13px] text-earth">
                      {rate.price > 0
                        ? formatPrice({ amount: rate.price, currency: rate.currency }, locale)
                        : dict.cart.free}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="eyebrow m-0 text-slate">{dict.checkout.payment}</h2>

          {methods.length === 0 ? (
            <p className="m-0 text-[14px] text-olive">{dict.checkout.noMethods}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {methods.map((option) => (
                <li key={option.id}>
                  <label
                    className={`flex cursor-pointer flex-col gap-1 border px-4 py-3 transition-colors ${
                      method === option.id ? 'border-olive bg-olive/6' : 'border-earth/20 hover:border-earth/45'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        value={option.id}
                        checked={method === option.id}
                        onChange={() => setMethod(option.id)}
                        className="accent-earth"
                      />
                      <span className="text-[15px] text-earth">{option.title}</span>
                    </span>
                    {option.description && (
                      <span className="pl-7 text-[13px] leading-relaxed text-slate">
                        {option.description}
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-[0.1em] text-slate uppercase">
              {dict.checkout.note}
            </span>
            <textarea
              name="note"
              value={form.note}
              onChange={set('note')}
              rows={3}
              placeholder={dict.checkout.notePlaceholder}
              className="border border-earth/25 bg-paper px-3 py-2.5 text-[15px] text-earth outline-none focus:border-olive"
            />
          </label>
        </section>
      </div>

      <aside className="h-fit border border-earth/15 bg-paper p-6 lg:sticky lg:top-28">
        <h2 className="eyebrow m-0 mb-4 text-slate">{dict.checkout.summary}</h2>

        <ul className="m-0 mb-4 flex list-none flex-col gap-3 p-0">
          {lines.map((line) => (
            <li key={line.key} className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-earth">
                {line.name}
                {line.quantity > 1 && <span className="text-slate"> × {line.quantity}</span>}
              </span>
              <span className="shrink-0 font-mono text-[13px] text-earth">
                {formatPrice(line.lineTotal, locale)}
              </span>
            </li>
          ))}
        </ul>

        {cart && (
          <CartTotalsPanel
            totals={cart.totals}
            locale={locale}
            dict={dict}
            shippingKnown={shippingChosen}
          />
        )}

        {error && (
          <p role="alert" className="mt-4 mb-0 border-l-2 border-olive bg-olive/8 px-3 py-2 text-[13px] text-olive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-5 w-full cursor-pointer bg-earth py-4 font-mono text-[11px] tracking-[0.12em] text-paper uppercase transition-colors hover:bg-olive disabled:cursor-not-allowed disabled:opacity-45"
        >
          {placing ? dict.checkout.placing : dict.checkout.placeOrder}
        </button>

        <Link
          href={`/${locale}/carrito`}
          className="mt-3 block text-center font-mono text-[11px] tracking-[0.12em] text-slate uppercase underline underline-offset-4 hover:text-earth"
        >
          {dict.checkout.backToCart}
        </Link>
      </aside>
    </form>
  )
}

const AUTOCOMPLETE: Record<keyof FormState, string> = {
  firstName: 'given-name',
  lastName: 'family-name',
  email: 'email',
  phone: 'tel',
  address1: 'address-line1',
  address2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  postcode: 'postal-code',
  country: 'country',
  note: 'off',
}
