import Image from 'next/image'
import type { ReactNode } from 'react'

import type { ContentImage } from '@/lib/about/types'

/**
 * Encabezado de las páginas institucionales: texto a la izquierda y foto a
 * sangre a la derecha. El `padding-top` deja lugar al header fijo.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  breadcrumbs,
}: {
  eyebrow: string
  title: string
  lead: string
  image: ContentImage
  breadcrumbs?: ReactNode
}) {
  return (
    <header className="grid bg-linen-warm text-ink md:min-h-[78vh] md:grid-cols-2">
      <div className="flex flex-col justify-end px-[var(--spacing-gutter)] pb-[clamp(40px,7vh,88px)] pt-[clamp(120px,16vh,168px)]">
        {breadcrumbs && <div className="mb-auto pb-10 text-graphite">{breadcrumbs}</div>}
        <div className="eyebrow mb-5 text-graphite">{eyebrow}</div>
        <h1 className="m-0 max-w-[620px] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.98] tracking-[-0.01em]">
          {title}
        </h1>
        <p className="mb-0 mt-7 max-w-[520px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-graphite">
          {lead}
        </p>
      </div>
      <div className="relative aspect-4/3 md:aspect-auto">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          style={{ objectPosition: image.position ?? 'center' }}
        />
      </div>
    </header>
  )
}
