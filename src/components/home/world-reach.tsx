import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

export function WorldReach({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-linen px-[var(--spacing-gutter)] pb-[clamp(80px,11vh,130px)] text-ink">
      <Reveal className="mx-auto max-w-[760px] text-center">
        <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-[1.02]">
          {dict.world.titleTop}
          <br />
          {dict.world.titleBottom}
        </h2>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-[1100px]">
        <PendingShot label={dict.world.mapCaption} ratio="2/1" tone="light" align="center" />
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
