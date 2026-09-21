'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { sendContact, subscribeNewsletter, type FormState } from '@/lib/leads/actions'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

export interface FooterLink {
  href: string
  label: string
}

const INITIAL: FormState = { status: 'idle' }

const PAYMENT_METHODS = ['VISA', 'MASTERCARD', 'PAYPAL', 'MERCADO PAGO']

function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string
  pendingLabel: string
  className: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  )
}

function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return null
  return (
    // Éxito y error comparten color: la paleta no tiene un rojo, y de los
    // acentos que quedan ninguno llega a 4,5:1 sobre este fondo. Lo que pasó lo
    // dice el mensaje, que es además lo que lee un lector de pantalla.
    <p role="status" className="font-mono text-xs text-earth">
      {state.message}
    </p>
  )
}

export function SiteFooter({
  locale,
  dict,
  aboutLinks,
}: {
  locale: Locale
  dict: Dictionary
  /** Secciones de Nosotros: vienen del contenido, así una nueva aparece sola. */
  aboutLinks: FooterLink[]
}) {
  const explore: FooterLink[] = [
    { href: routes.shop(locale), label: dict.nav.shop },
    { href: routes.about(locale), label: dict.nav.about },
    ...aboutLinks,
    { href: routes.blog(locale), label: dict.nav.news },
  ]

  const [contactState, contactAction] = useActionState(sendContact, INITIAL)
  const [newsletterState, newsletterAction] = useActionState(subscribeNewsletter, INITIAL)

  const field =
    'w-full border border-slate/40 bg-transparent px-4 py-3 text-sm text-earth placeholder:text-slate focus:border-earth focus:outline-none'

  return (
    <footer className="border-t border-earth/20 bg-shell px-[var(--spacing-gutter)] pb-10 pt-[clamp(70px,10vh,120px)] text-earth">
      <div className="mx-auto grid max-w-[1100px] gap-[clamp(40px,6vw,80px)] md:grid-cols-2">
        <div>
          <h2 className="mb-5 font-display text-[clamp(30px,4vw,50px)] font-medium leading-none">
            {dict.footer.contactTitle}
          </h2>
          <p className="mb-6 max-w-[360px] text-[15px] leading-relaxed text-slate">
            {dict.footer.contactLead}
          </p>

          <form action={contactAction} className="flex max-w-[400px] flex-col gap-3">
            <input type="hidden" name="locale" value={locale} />
            <label className="sr-only" htmlFor="contact-name">
              {dict.footer.name}
            </label>
            <input
              id="contact-name"
              name="name"
              placeholder={dict.footer.name}
              autoComplete="name"
              className={field}
            />
            <label className="sr-only" htmlFor="contact-email">
              {dict.footer.email}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder={dict.footer.email}
              autoComplete="email"
              className={field}
            />
            <label className="sr-only" htmlFor="contact-message">
              {dict.footer.message}
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={3}
              placeholder={dict.footer.message}
              className={`${field} resize-y`}
            />
            <SubmitButton
              label={dict.footer.send}
              pendingLabel={dict.footer.sending}
              className="cursor-pointer bg-earth py-3 font-mono text-xs tracking-[0.1em] text-paper transition-colors hover:bg-olive disabled:opacity-60"
            />
            <FormMessage state={contactState} />
          </form>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <div className="mb-3.5 font-mono text-[11px] tracking-[0.15em] text-slate">
              {dict.footer.newsletter.toUpperCase()}
            </div>
            <form action={newsletterAction} className="flex max-w-[340px] gap-2">
              <input type="hidden" name="locale" value={locale} />
              <label className="sr-only" htmlFor="newsletter-email">
                {dict.footer.email}
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder={dict.footer.newsletterPlaceholder}
                autoComplete="email"
                className={`${field} flex-1`}
              />
              <SubmitButton
                label="→"
                pendingLabel="…"
                className="cursor-pointer bg-earth px-5 font-mono text-xs text-paper transition-colors hover:bg-olive disabled:opacity-60"
              />
            </form>
            <div className="mt-2">
              <FormMessage state={newsletterState} />
            </div>
          </div>

          <nav aria-label={dict.footer.explore}>
            <div className="mb-3.5 font-mono text-[11px] tracking-[0.15em] text-earth">
              {dict.footer.explore.toUpperCase()}
            </div>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-2 p-0 text-sm">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-earth transition-colors hover:text-olive">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <address className="text-sm not-italic leading-[1.9] text-slate">
            <div className="mb-2.5 font-mono text-[11px] tracking-[0.15em] text-earth">
              {dict.footer.contact.toUpperCase()}
            </div>
            {dict.footer.address}
            <br />
            {dict.footer.city}
            <br />
            <a href={site.whatsapp} className="text-earth underline underline-offset-4 hover:text-olive">
              {dict.footer.phone}
            </a>
            <br />
            <a
              href={site.instagram}
              className="text-earth underline underline-offset-4 hover:text-olive"
              rel="me noopener"
            >
              {dict.footer.instagram}
            </a>
          </address>

          <div>
            <div className="mb-3 font-mono text-[11px] tracking-[0.15em] text-slate">
              {dict.footer.payments.toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded border border-dashed border-slate/40 px-3 py-1.5 font-mono text-[10px] text-slate"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-[1100px] flex-wrap items-center justify-between gap-4 border-t border-slate/20 pt-6">
        <Image
          src="/logo-ruralanas.png"
          alt={site.name}
          width={1119}
          height={278}
          className="h-9 w-auto"
        />
        <div className="font-mono text-[11px] text-slate">
          {dict.footer.tagline.toUpperCase()} · © {new Date().getFullYear()}
        </div>
        <div className="font-mono text-[11px] text-slate">ES · EN · FR · DE</div>
      </div>
    </footer>
  )
}
