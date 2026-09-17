import Image from 'next/image'
import Link from 'next/link'

import { Reveal } from '@/components/ui/reveal'
import type { ContentBlock } from '@/lib/about/types'
import { catalog } from '@/lib/catalog'
import type { Locale } from '@/lib/i18n'
import { resolveTarget } from '@/lib/routes'

/**
 * Dibuja los bloques de una página institucional. Cada tipo de bloque tiene un
 * único diseño, así todas las páginas de Nosotros se leen como una sola pieza.
 */

const WRAP = 'px-[var(--spacing-gutter)] py-[clamp(56px,9vh,112px)]'
const INNER = 'mx-auto max-w-[1100px]'

/** Clases completas: Tailwind no ve las que se arman con interpolación. */
const FIGURE_COLUMNS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

function Heading({ eyebrow, title, lead }: { eyebrow?: string; title?: string; lead?: string }) {
  if (!eyebrow && !title) return null
  return (
    <div className="max-w-[640px]">
      {eyebrow && <div className="eyebrow mb-4 text-graphite">{eyebrow}</div>}
      {title && (
        <h2 className="m-0 font-display text-[clamp(28px,3.8vw,48px)] font-medium leading-[1.05] text-ink">
          {title}
        </h2>
      )}
      {lead && <p className="mb-0 mt-5 text-[17px] leading-relaxed text-graphite">{lead}</p>}
    </div>
  )
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-5 text-[17px] leading-[1.75] text-graphite">
      {items.map((text) => (
        <p key={text} className="m-0">
          {text}
        </p>
      ))}
    </div>
  )
}

async function Artisans({
  block,
  locale,
}: {
  block: Extract<ContentBlock, { type: 'artisans' }>
  locale: Locale
}) {
  const artisans = await catalog.listArtisans(locale)
  // Sin datos reales no se muestra nada: nunca se inventa una artesana.
  if (artisans.length === 0) return null

  return (
    <section className={WRAP}>
      <div className={INNER}>
        <Heading eyebrow={block.eyebrow} title={block.title} lead={block.lead} />
        <ul className="mt-12 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {artisans.map((artisan) => (
            <Reveal as="li" key={artisan.id}>
              <div className="relative aspect-4/5 overflow-hidden bg-sand">
                {artisan.portrait && (
                  <Image
                    src={artisan.portrait}
                    alt={artisan.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 260px"
                    className="object-cover"
                  />
                )}
              </div>
              <h3 className="mb-1 mt-4 font-display text-xl font-medium text-ink">{artisan.name}</h3>
              <div className="font-mono text-[11px] tracking-[0.12em] text-stone uppercase">
                {artisan.region}
              </div>
              {artisan.bio && <p className="mb-0 mt-3 text-sm leading-relaxed text-graphite">{artisan.bio}</p>}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Block({ block, locale }: { block: ContentBlock; locale: Locale }) {
  switch (block.type) {
    case 'text':
      return (
        <section className={WRAP}>
          <Reveal className={`${INNER} grid gap-8 md:grid-cols-[1fr_1.3fr] md:gap-16`}>
            <Heading eyebrow={block.eyebrow} title={block.title} />
            <Paragraphs items={block.paragraphs} />
          </Reveal>
        </section>
      )

    case 'split': {
      const imageLeft = block.imageSide === 'left'
      return (
        <section className={WRAP}>
          <div className={`${INNER} grid items-center gap-10 md:grid-cols-2 md:gap-[clamp(40px,6vw,96px)]`}>
            <Reveal
              className={`relative aspect-4/5 overflow-hidden bg-sand ${imageLeft ? '' : 'md:order-2'}`}
            >
              <Image
                src={block.image.src}
                alt={block.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 520px"
                className="object-cover"
                style={{ objectPosition: block.image.position ?? 'center' }}
              />
            </Reveal>
            <Reveal className="flex flex-col gap-7">
              <Heading eyebrow={block.eyebrow} title={block.title} />
              <Paragraphs items={block.paragraphs} />
            </Reveal>
          </div>
        </section>
      )
    }

    case 'figures':
      return (
        <section className="px-[var(--spacing-gutter)]">
          <Reveal
            as="dl"
            className={`${INNER} m-0 grid grid-cols-2 border-y border-ink/15 py-[clamp(32px,5vh,56px)] ${FIGURE_COLUMNS[Math.min(block.items.length, 4)]}`}
          >
            {block.items.map((item) => (
              <div key={item.label} className="px-2 py-4 text-center">
                <dt className="sr-only">{item.label}</dt>
                <dd className="m-0 font-display text-[clamp(34px,4.4vw,56px)] font-medium leading-none text-ink">
                  {item.value}
                </dd>
                <dd className="mx-auto mb-0 mt-3 max-w-[200px] text-[13px] leading-snug text-graphite">
                  {item.label}
                </dd>
              </div>
            ))}
          </Reveal>
        </section>
      )

    case 'steps':
      return (
        <section className={WRAP}>
          <div className={INNER}>
            <Heading eyebrow={block.eyebrow} title={block.title} lead={block.lead} />
            <ol className="mt-12 grid list-none gap-x-10 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {block.items.map((item, index) => (
                <Reveal as="li" key={item.title} delayMs={index * 60} className="border-t border-ink/15 pt-6">
                  <div className="font-mono text-xs tracking-[0.12em] text-bronze">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mb-3 mt-3 font-display text-2xl font-medium text-ink">{item.title}</h3>
                  <p className="m-0 text-[15px] leading-relaxed text-graphite">{item.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )

    case 'features':
      return (
        <section className={`${WRAP} bg-linen-soft`}>
          <div className={INNER}>
            <Heading eyebrow={block.eyebrow} title={block.title} lead={block.lead} />
            <ul className="mt-12 grid list-none gap-x-10 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {block.items.map((item, index) => (
                <Reveal as="li" key={item.title} delayMs={index * 60}>
                  <h3 className="mb-3 mt-0 text-[15px] font-semibold tracking-[0.03em] text-ink uppercase">
                    {item.title}
                  </h3>
                  <p className="m-0 text-[15px] leading-relaxed text-graphite">{item.text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )

    case 'timeline':
      return (
        <section className={WRAP}>
          <div className={INNER}>
            <Heading eyebrow={block.eyebrow} title={block.title} />
            <ol className="mt-12 list-none p-0">
              {block.items.map((item) => (
                <Reveal
                  as="li"
                  key={`${item.date}-${item.title}`}
                  className="grid gap-2 border-t border-ink/15 py-7 md:grid-cols-[200px_1fr] md:gap-10"
                >
                  <div className="font-mono text-[13px] tracking-[0.08em] text-bronze uppercase">{item.date}</div>
                  <div>
                    <h3 className="m-0 font-display text-2xl font-medium text-ink">{item.title}</h3>
                    <p className="mb-0 mt-2 max-w-[620px] text-[15px] leading-relaxed text-graphite">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )

    case 'quote':
      return (
        <section className={`${WRAP} bg-sand`}>
          <Reveal as="figure" className="mx-auto m-0 max-w-[860px] text-center">
            <blockquote className="m-0 font-display text-[clamp(24px,3.2vw,38px)] font-normal leading-[1.3] text-ink">
              “{block.text}”
            </blockquote>
            <figcaption className="eyebrow mt-8 text-graphite">{block.source}</figcaption>
          </Reveal>
        </section>
      )

    case 'certifications':
      // Sin certificados cargados no hay bloque: un sello inventado es peor que ninguno.
      if (block.items.length === 0) return null
      return (
        <section className={WRAP}>
          <div className={INNER}>
            <Heading eyebrow={block.eyebrow} title={block.title} lead={block.lead} />
            <ul className="mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {block.items.map((item) => (
                <Reveal as="li" key={item.name} className="border border-ink/15 p-7">
                  {item.image && (
                    <div className="relative mb-6 h-16 w-28">
                      <Image src={item.image.src} alt={item.image.alt} fill sizes="112px" className="object-contain object-left" />
                    </div>
                  )}
                  <h3 className="m-0 font-display text-xl font-medium text-ink">{item.name}</h3>
                  <div className="mt-1 font-mono text-[11px] tracking-[0.1em] text-stone uppercase">{item.issuer}</div>
                  <p className="mb-0 mt-4 text-[15px] leading-relaxed text-graphite">{item.text}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-[13px] text-ink underline underline-offset-4 hover:text-bronze"
                    >
                      {new URL(item.url).hostname.replace(/^www\./, '')} ↗
                    </a>
                  )}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )

    case 'artisans':
      return <Artisans block={block} locale={locale} />

    case 'cta':
      return (
        <section className="bg-bark px-[var(--spacing-gutter)] py-[clamp(56px,9vh,96px)] text-linen">
          <Reveal className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-[620px]">
              <h2 className="m-0 font-display text-[clamp(28px,3.6vw,44px)] font-medium leading-tight">{block.title}</h2>
              {block.text && <p className="mb-0 mt-3 text-[16px] leading-relaxed text-linen/75">{block.text}</p>}
            </div>
            <Link
              href={resolveTarget(block.to, locale)}
              className="shrink-0 border border-linen/80 px-7 py-3.5 text-[13px] tracking-[0.08em] uppercase transition-colors hover:bg-linen hover:text-ink"
            >
              {block.label}
            </Link>
          </Reveal>
        </section>
      )
  }
}

export function ContentBlocks({ blocks, locale }: { blocks: ContentBlock[]; locale: Locale }) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={`${block.type}-${index}`} block={block} locale={locale} />
      ))}
    </>
  )
}
