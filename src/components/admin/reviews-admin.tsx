'use client'

/**
 * Admin de reseñas.
 *
 * Herramienta interna, **en español y sin traducir**: la usa el equipo, no el
 * visitante, y meterla en los diccionarios sólo agregaría ruido a los textos
 * de la tienda.
 *
 * Lo que carga acá va a parar a WooCommerce y sale publicado en la home. Por
 * eso el formulario pide la pieza: una reseña siempre es de algo concreto.
 */

import { useCallback, useEffect, useState } from 'react'

import { Stars } from '@/components/ui/stars'
import { formatMonthYear } from '@/lib/format'
import type { Review, ReviewsSummary } from '@/lib/reviews/types'
import type { Locale } from '@/lib/i18n/config'

import { adminFetch } from './admin-fetch'

interface ProductOption {
  id: string
  name: string
}

interface Payload {
  reviews: Review[]
  summary: ReviewsSummary
  canCreate: boolean
  products: ProductOption[]
}

const EMPTY_FORM = { productId: '', author: '', email: '', text: '', rating: '5' }

const field =
  'w-full border border-earth/25 bg-paper px-3 py-2.5 text-[15px] text-earth outline-none focus:border-olive'
const label = 'font-sans text-[11px] tracking-[0.1em] text-slate uppercase'

export function ReviewsAdmin({ locale }: { locale: Locale }) {
  const [loaded, setLoaded] = useState(false)
  const [data, setData] = useState<Payload | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const response = await adminFetch(`/api/admin/reviews?locale=${locale}`)
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'No se pudieron leer las reseñas.')
    } else {
      setData((await response.json()) as Payload)
    }
    setLoaded(true)
  }, [locale])

  useEffect(() => {
    void load()
  }, [load])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await adminFetch(`/api/admin/reviews?locale=${locale}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      })
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setError(body.error ?? 'No se pudo cargar la reseña.')
        return
      }
      setForm(EMPTY_FORM)
      setNotice('Reseña cargada y publicada.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const set =
    (key: keyof typeof EMPTY_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }))

  if (!loaded) {
    return (
      <p className="py-20 text-center font-sans text-[12px] tracking-[0.12em] text-slate uppercase">
        Cargando…
      </p>
    )
  }

  return (
    <div className="grid gap-12 py-12 lg:grid-cols-[380px_1fr]">
      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="m-0 font-display text-[24px] text-earth">Cargar una reseña</h2>
        </div>

        {data && !data.canCreate ? (
          <p className="m-0 border-l-2 border-caramel bg-caramel/10 px-4 py-3 text-[14px] leading-relaxed text-slate">
            El origen de reseñas activo es el curado, que se edita en el código. Para cargar desde
            acá hay que poner <code>REVIEWS_SOURCE=woo</code>.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={label}>Pieza reseñada</span>
              <select value={form.productId} onChange={set('productId')} required className={field}>
                <option value="">Elegí una pieza</option>
                {data?.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <label className="flex flex-col gap-1.5">
                <span className={label}>Quién la escribió</span>
                <input value={form.author} onChange={set('author')} required className={field} />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={label}>Estrellas</span>
                <select value={form.rating} onChange={set('rating')} className={field}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={label}>Email (opcional)</span>
              <input type="email" value={form.email} onChange={set('email')} className={field} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={label}>Texto, tal cual lo escribió</span>
              <textarea value={form.text} onChange={set('text')} rows={5} required className={field} />
            </label>

            <p className="m-0 text-[12px] leading-relaxed text-slate">
              Cargá sólo texto real, con permiso de quien lo escribió. Va a aparecer con su nombre
              en la portada del sitio.
            </p>

            {error && (
              <p role="alert" className="m-0 border-l-2 border-olive bg-olive/8 px-3 py-2 text-[13px] text-olive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="m-0 border-l-2 border-caramel bg-caramel/10 px-3 py-2 text-[13px] text-earth">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer bg-earth py-3.5 font-sans text-[11px] tracking-[0.12em] text-paper uppercase hover:bg-olive disabled:opacity-50"
            >
              {busy ? 'Cargando…' : 'Publicar reseña'}
            </button>
          </form>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-baseline gap-4">
          <h2 className="m-0 font-display text-[24px] text-earth">Publicadas</h2>
          {data && data.summary.count > 0 && data.summary.average !== null && (
            <span className="font-sans text-[12px] text-slate">
              {data.summary.average.toFixed(1)} de 5 · {data.summary.count}
            </span>
          )}
        </div>

        {!data || data.reviews.length === 0 ? (
          <p className="m-0 text-[15px] leading-relaxed text-slate">
            Todavía no hay ninguna. Mientras la lista esté vacía, la sección de la portada no
            muestra testimonios.
          </p>
        ) : (
          <ul className="m-0 list-none border-t border-earth/12 p-0">
            {data.reviews.map((review) => (
              <li key={review.id} className="border-b border-earth/12 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Stars rating={review.rating} />
                    <span className="text-[15px] text-earth">{review.author}</span>
                  </div>
                  <span className="font-sans text-[11px] text-slate">
                    {formatMonthYear(review.publishedAt, locale)}
                    {review.product ? ` · ${review.product.name}` : ''}
                  </span>
                </div>
                <p className="mt-2 mb-0 text-[15px] leading-relaxed text-slate">{review.text}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 mb-0 text-[12px] leading-relaxed text-slate">
          Para editar o borrar una reseña, se hace desde WordPress: Productos → Reseñas. Acá sólo
          se cargan.
        </p>
      </section>
    </div>
  )
}
