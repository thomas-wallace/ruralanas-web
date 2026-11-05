'use client'

/**
 * Suscripción a la newsletter: una franja discreta arriba del pie, en todas
 * las páginas públicas. Sin ventana emergente ni descuento a cambio: un campo
 * con una línea, como un renglón para escribir, y la acción en texto.
 *
 * No aparece donde distrae de otra cosa: el carrito, el checkout, la página de
 * gracias y el admin.
 *
 * El alta va a `subscribeNewsletter`, que la pasa al proveedor de mailing que
 * esté configurado (ver `lib/newsletter`). El texto de consentimiento viaja con
 * el alta para que quede registrado tal cual se mostró.
 */

import { usePathname } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { subscribeNewsletter, type FormState } from '@/lib/leads/actions'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

const INITIAL: FormState = { status: 'idle' }
const HIDDEN_ON = ['/carrito', '/checkout', '/gracias', '/admin']

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 cursor-pointer py-3 font-sans text-[11px] tracking-[0.14em] text-earth uppercase transition-colors hover:text-olive disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? '…' : `${label} →`}
    </button>
  )
}

export function NewsletterSignup({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname() ?? ''
  const [state, action] = useActionState(subscribeNewsletter, INITIAL)
  const t = dict.newsletter

  if (HIDDEN_ON.some((path) => pathname.startsWith(`/${locale}${path}`))) return null

  return (
    <section
      aria-labelledby="newsletter-title"
      className="border-t border-earth/12 bg-paper px-[var(--spacing-gutter)] py-[clamp(48px,7vh,84px)] text-earth"
    >
      <div className="mx-auto grid max-w-[1100px] items-end gap-x-16 gap-y-8 md:grid-cols-[1fr_minmax(0,420px)]">
        <div>
          <div className="font-sans text-[11px] tracking-[0.2em] text-olive uppercase">{t.eyebrow}</div>
          <h2 id="newsletter-title" className="mt-3 mb-0 font-display text-[clamp(26px,3vw,36px)] font-medium leading-tight">
            {t.title}
          </h2>
          <p className="mt-3 mb-0 max-w-[440px] text-[15px] leading-relaxed text-slate">{t.text}</p>
        </div>

        {state.status === 'ok' ? (
          <p role="status" className="m-0 border-b border-earth/40 py-3 text-[15px] text-earth">
            {state.message}
          </p>
        ) : (
          <form action={action}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="origin" value="franja" />
            <input type="hidden" name="consent" value={t.consent} />
            {/* Trampa para bots: fuera de la vista y del orden de tabulación. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Web
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex items-end gap-4 border-b border-earth/40 transition-colors focus-within:border-earth">
              <label htmlFor="newsletter-email" className="sr-only">
                {t.placeholder}
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t.placeholder}
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-earth outline-none placeholder:text-slate"
              />
              <Submit label={t.cta} />
            </div>

            <p className="mt-3 mb-0 text-[12px] leading-relaxed text-slate">{t.consent}</p>
            {state.status === 'error' && (
              <p role="alert" className="mt-2 mb-0 font-sans text-xs text-earth">
                {state.message}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
