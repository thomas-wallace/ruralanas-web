import Image from 'next/image'
import Link from 'next/link'

import { ProductCard } from '@/components/shop/product-card'
import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import { ScrollRail } from '@/components/ui/scroll-rail'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

type LineImage = { src: string; alt: string } | null

/** Entrada grande a una línea de producto (Deco, Cuero). */
export interface PeekLine {
  key: string
  title: string
  shot: string
  image: LineImage
  /** Categoría de la tienda. `null` lleva a la tienda entera. */
  category: string | null
}

/**
 * Adelanto del catálogo: un carril horizontal con los productos destacados, el
 * acceso a la tienda y las entradas por línea de producto.
 */
export function CatalogPeek({
  products,
  lines,
  locale,
  dict,
}: {
  products: ProductSummary[]
  lines: PeekLine[]
  locale: Locale
  dict: Dictionary
}) {
  const shop = routes.shop(locale)

  return (
    <section className="bg-linen-warm px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink">
      <div className="mx-auto max-w-[1240px]">
        <Reveal as="h2" className="eyebrow m-0 mb-8 text-graphite">
          {dict.peek.eyebrow}
        </Reveal>

        {products.length > 0 && (
          <ScrollRail
            label={dict.peek.eyebrow}
            prevLabel={dict.peek.prev}
            nextLabel={dict.peek.next}
          >
            {products.map((product) => (
              <li
                key={product.id}
                className="w-[72%] shrink-0 snap-start sm:w-[calc((100%-2*clamp(14px,2vw,24px))/3)] lg:w-[calc((100%-3*clamp(14px,2vw,24px))/4)]"
              >
                <ProductCard product={product} locale={locale} dict={dict} />
              </li>
            ))}
          </ScrollRail>
        )}

        <Reveal className="mt-12 flex justify-center">
          <Link
            href={shop}
            className="inline-block w-full max-w-[440px] bg-bark px-8 py-3.5 text-center text-[13px] font-semibold tracking-[0.08em] text-linen uppercase transition-colors hover:bg-ink"
          >
            {dict.peek.cta}
          </Link>
        </Reveal>

        <ul className="mt-[clamp(48px,8vh,88px)] grid list-none gap-[clamp(14px,2vw,24px)] p-0 sm:grid-cols-2">
          {lines.map((line) => (
            <Reveal as="li" key={line.key}>
              <Link
                href={routes.shop(locale, line.category ?? undefined)}
                className="group relative block aspect-square overflow-hidden"
              >
                {line.image ? (
                  <>
                    <Image
                      src={line.image.src}
                      alt={line.image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 620px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-linear-to-t from-carbon/65 via-carbon/10 to-transparent"
                    />
                  </>
                ) : (
                  // Hasta que esté la foto, el marco deja a la vista cuál falta.
                  <PendingShot
                    label={line.shot}
                    ratio="1/1"
                    tone="light"
                    align="center"
                    className="h-full"
                  />
                )}
                <span
                  className={`absolute bottom-[clamp(20px,3vw,36px)] left-[clamp(20px,3vw,36px)] font-display text-[clamp(30px,3.6vw,48px)] font-medium leading-none transition-transform group-hover:-translate-y-1 ${
                    line.image ? 'text-linen' : 'text-ink'
                  }`}
                >
                  {line.title}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
