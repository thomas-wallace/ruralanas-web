import Link from 'next/link'

import { Reveal } from '@/components/ui/reveal'
import { Stars } from '@/components/ui/stars'
import { formatMonthYear, interpolate } from '@/lib/format'
import type { ReviewsPage } from '@/lib/reviews/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

/**
 * Lo que dicen quienes nos visten.
 *
 * Las reseñas son reales y salen de WooCommerce, que es donde la empresa las
 * carga y modera. Cada una muestra la pieza que reseña: en una tienda de
 * piezas únicas eso convence más que un elogio suelto a la marca, y de paso
 * lleva al visitante al producto.
 *
 * Si no hay ninguna reseña, el bloque no se dibuja y queda sólo la franja de
 * reconocimientos. Sin prueba social real no se muestra prueba social.
 */
export function Testimonials({
  page,
  locale,
  dict,
}: {
  page: ReviewsPage
  locale: Locale
  dict: Dictionary
}) {
  const { reviews, summary } = page

  return (
    <section className="bg-ember px-[var(--spacing-gutter)] pt-[var(--spacing-section)] text-linen">
      {reviews.length > 0 && (
        <>
          <Reveal className="mx-auto max-w-[760px] text-center">
            <div className="mb-4 font-mono text-xs tracking-[0.2em] text-bronze uppercase">
              {dict.testimonials.eyebrow}
            </div>
            <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-none">
              {dict.testimonials.title}
            </h2>

            {/* Datos de muestra: se dice, y se dice fuerte. Una sección de
                testimonios que no distingue lo real de lo inventado no sirve
                ni para revisar el diseño. */}
            {page.source === 'demo' && (
              <p className="mx-auto mt-5 mb-0 max-w-[46ch] border border-dashed border-bronze/70 px-4 py-2.5 font-mono text-[11px] leading-relaxed tracking-[0.08em] text-bronze uppercase">
                {dict.testimonials.demoNotice}
              </p>
            )}

            {summary.average !== null && summary.count > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Stars rating={summary.average} />
                <span className="font-mono text-[12px] tracking-[0.1em] text-stone">
                  {interpolate(dict.testimonials.summary, {
                    average: summary.average.toFixed(1),
                    count: summary.count,
                  })}
                </span>
              </div>
            )}
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-[1100px] gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <Reveal
                key={review.id}
                as="figure"
                className="m-0 flex flex-col rounded-sm border border-stone/25 px-7 py-8"
              >
                <Stars rating={review.rating} />

                <blockquote className="m-0 mt-4 mb-6 font-display text-xl font-normal leading-snug">
                  “{review.text}”
                </blockquote>

                <figcaption className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {review.avatar ? (
                      // Avatar de Gravatar: dominio no declarado en next.config,
                      // así que va como <img> normal.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.avatar}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone/40 font-mono text-[13px] text-stone">
                        {review.author.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="text-sm">{review.author}</div>
                      <div className="font-mono text-[11px] text-stone">
                        {formatMonthYear(review.publishedAt, locale)}
                        {review.verified && ` · ${dict.testimonials.verified}`}
                      </div>
                    </div>
                  </div>

                  {review.product?.slug && (
                    <Link
                      href={`/${locale}/tienda/${review.product.slug}`}
                      className="font-mono text-[11px] tracking-[0.08em] text-bronze uppercase underline underline-offset-4 hover:text-linen"
                    >
                      {dict.testimonials.aboutPiece} {review.product.name}
                    </Link>
                  )}
                </figcaption>
              </Reveal>
            ))}
          </div>
        </>
      )}

      <Reveal
        className={`mx-auto max-w-[1100px] pb-[clamp(80px,11vh,130px)] ${
          reviews.length > 0 ? 'mt-11 border-t border-stone/20 pt-11' : 'pt-4'
        }`}
      >
        <div className="mb-7 text-center font-mono text-[11px] tracking-[0.2em] text-stone uppercase">
          {dict.awards.title}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {dict.awards.items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded border border-dashed border-stone/40 px-7.5 py-4.5 font-mono text-[11px] text-stone"
            >
              [ {item.toUpperCase()} ]
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
