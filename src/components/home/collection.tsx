import Link from 'next/link'

import { ProductCard } from '@/components/shop/product-card'
import { Reveal } from '@/components/ui/reveal'
import type { ProductSummary } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

export function Collection({
  products,
  locale,
  dict,
}: {
  products: ProductSummary[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <section
      id="coleccion"
      className="bg-ink px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-linen"
    >
      <Reveal className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-3.5 font-mono text-xs tracking-[0.2em] text-bronze uppercase">
            {dict.collection.eyebrow}
          </div>
          <h2 className="m-0 font-display text-[clamp(34px,5.5vw,72px)] font-medium leading-none">
            {dict.collection.title}
          </h2>
        </div>
        <Link
          href={`/${locale}/tienda`}
          className="border-b border-bronze pb-1 font-mono text-[13px] tracking-[0.08em] text-linen uppercase hover:text-bronze"
        >
          {dict.collection.cta} →
        </Link>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-[1100px] grid-cols-2 gap-[clamp(18px,2vw,28px)] lg:grid-cols-4">
        {products.map((product) => (
          <Reveal key={product.id}>
            <ProductCard product={product} locale={locale} dict={dict} tone="dark" />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
