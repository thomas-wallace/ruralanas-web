import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/ui/reveal'
import type { AboutSection } from '@/lib/about/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/** Tarjetas que llevan a las secciones de Nosotros. */
export function SectionCards({
  title,
  sections,
  locale,
  dict,
}: {
  title: string
  sections: AboutSection[]
  locale: Locale
  dict: Dictionary
}) {
  if (sections.length === 0) return null

  return (
    <section className="bg-linen-warm px-[var(--spacing-gutter)] py-[clamp(64px,10vh,120px)] text-ink">
      <div className="mx-auto max-w-[1100px]">
        <Reveal as="h2" className="m-0 font-display text-[clamp(28px,3.8vw,48px)] font-medium leading-tight">
          {title}
        </Reveal>
        <ul
          className={`mt-12 grid list-none gap-x-6 gap-y-12 p-0 sm:grid-cols-2 ${
            sections.length === 3 ? 'lg:grid-cols-3' : ''
          }`}
        >
          {sections.map((section, index) => (
            <Reveal as="li" key={section.slug} delayMs={index * 70}>
              <Link href={routes.about(locale, section.slug)} className="group block">
                <div className="relative aspect-3/2 overflow-hidden bg-sand">
                  <Image
                    src={section.image.src}
                    alt={section.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 540px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ objectPosition: section.image.position ?? 'center' }}
                  />
                </div>
                <div className="eyebrow mt-5 text-graphite">{section.eyebrow}</div>
                <h3 className="mb-0 mt-2 font-display text-[26px] font-medium leading-tight">{section.title}</h3>
                <p className="mb-0 mt-2 max-w-[460px] text-[15px] leading-relaxed text-graphite">
                  {section.summary}
                </p>
                <span className="mt-4 inline-block text-[13px] tracking-[0.06em] uppercase underline underline-offset-4 transition-colors group-hover:text-bronze">
                  {dict.about.discover}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
