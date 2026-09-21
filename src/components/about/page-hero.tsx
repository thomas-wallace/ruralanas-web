import Image from 'next/image'

import { Watermark } from '@/components/ui/watermark'
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
    <header className="grid bg-paper text-earth md:min-h-[78vh] md:grid-cols-2">
      <div className="relative isolate flex flex-col justify-end overflow-hidden px-[var(--spacing-gutter)] pb-[clamp(40px,7vh,88px)] pt-[clamp(120px,16vh,168px)]">
        {/*
          Entra a sangre por el borde izquierdo: el `overflow-hidden` del padre
          la recorta, y así el huso se lee como parte del papel y no como una
          figura pegada encima. Se oculta en pantalla angosta, donde la columna
          no tiene ancho de sobra y quedaría justo debajo del texto.
        */}
        <Watermark className="-left-16 top-1/2 hidden h-[clamp(260px,42vh,440px)] -translate-y-1/2 md:block" />

        {breadcrumbs && <div className="mb-auto pb-10 text-slate">{breadcrumbs}</div>}
        <div className="eyebrow mb-5 text-slate">{eyebrow}</div>
        <h1 className="m-0 max-w-[620px] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.98] tracking-[-0.01em]">
          {title}
        </h1>
        <p className="mb-0 mt-7 max-w-[520px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-slate">
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
