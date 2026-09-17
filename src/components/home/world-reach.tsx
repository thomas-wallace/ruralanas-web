import Image from 'next/image'

import { Reveal } from '@/components/ui/reveal'
import { homeContent } from '@/content/home'
import type { Dictionary } from '@/lib/i18n'

/**
 * Grano de papel para el espacio del mapa: ruido fractal en SVG, sin pedir
 * ninguna imagen. Suaviza el fondo plano mientras llega el mapa en relieve.
 */
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .28 0 0 0 0 .2 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function WorldReach({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-linen px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink">
      <Reveal className="mx-auto max-w-[760px] text-center">
        <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-[1.02]">
          {dict.world.titleTop}
          <br />
          {dict.world.titleBottom}
        </h2>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-[1100px]">
        {homeContent.worldReach.mapImage ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm sm:aspect-[2/1]">
            <Image
              src={homeContent.worldReach.mapImage}
              alt={dict.world.mapCaption}
              fill
              sizes="(max-width: 1100px) 100vw, 1100px"
              className="object-cover"
            />
          </div>
        ) : (
          // Espacio reservado para el mapa en relieve, con la misma proporción.
          <div
            role="img"
            aria-label={dict.world.mapCaption}
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm sm:aspect-[2/1]"
            style={{
              backgroundColor: 'var(--color-sand)',
              backgroundImage: `radial-gradient(ellipse at 50% 45%, color-mix(in srgb, var(--color-parchment) 55%, transparent), transparent 70%), ${PAPER_GRAIN}`,
              boxShadow: 'inset 0 0 60px color-mix(in srgb, var(--color-bark) 12%, transparent)',
            }}
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-graphite/70 uppercase">
              {dict.world.mapCaption}
            </span>
          </div>
        )}
      </Reveal>

      <Reveal className="mx-auto mt-6.5 flex max-w-[900px] flex-wrap justify-center gap-2.5">
        {dict.world.markets.map((market) => (
          <span
            key={market}
            className="rounded-full border border-merlot/40 px-3.5 py-1.5 font-mono text-xs text-merlot"
          >
            {market}
          </span>
        ))}
        {dict.world.replicas.map((replica) => (
          <span
            key={replica}
            className="rounded-full border border-stone/50 px-3.5 py-1.5 font-mono text-xs text-stone"
          >
            {replica}
          </span>
        ))}
      </Reveal>
    </section>
  )
}
