import { CountUp } from '@/components/ui/count-up'
import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

/**
 * Banda de cifras. Lleva el id `threadEnd`: es donde el hilo de lana se mete
 * por debajo y termina el recorrido. El z-index positivo es lo que hace que el
 * ovillo desaparezca detrás de esta sección.
 */
export function StatsBand({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="threadEnd"
      className="relative z-3 bg-linen px-[var(--spacing-gutter)] py-[clamp(64px,9vh,110px)] text-ink"
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-[clamp(28px,4vw,48px)] text-center lg:grid-cols-4">
        {dict.stats.map((stat) => (
          <Reveal key={stat.label}>
            <CountUp
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="block font-display text-[clamp(46px,6vw,76px)] font-medium leading-none text-merlot"
            />
            <div className="mt-3 font-mono text-xs tracking-[0.1em] text-stone uppercase">
              {stat.label}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
