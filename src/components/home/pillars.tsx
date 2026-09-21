import Link from 'next/link'

import { Reveal } from '@/components/ui/reveal'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/**
 * Banda de tres pilares debajo del hero: materiales, producción y compromiso.
 * Cada columna lleva a su sección de Nosotros.
 */
export function Pillars({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section
      aria-label={dict.pillars.ariaLabel}
      className="bg-shell px-[var(--spacing-gutter)] py-[clamp(56px,9vh,96px)] text-earth"
    >
      <ul className="mx-auto grid max-w-[1240px] list-none gap-12 p-0 md:grid-cols-3 md:gap-[clamp(32px,4vw,64px)]">
        {dict.pillars.items.map((item) => (
          <Reveal as="li" key={item.section} className="flex flex-col items-start">
            <h2 className="m-0 font-sans text-[14px] font-medium tracking-[0.04em] uppercase">
              {item.title}
            </h2>
            <p className="mb-6 mt-5 max-w-[380px] text-[14px] leading-relaxed text-slate">
              {item.text}
            </p>
            <Link
              href={routes.about(locale, item.section)}
              className="mt-auto text-[13px] font-medium tracking-[0.04em] uppercase underline underline-offset-4 transition-colors hover:text-olive"
            >
              {item.cta}
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
