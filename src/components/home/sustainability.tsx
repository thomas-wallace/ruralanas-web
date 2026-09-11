import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

export function Sustainability({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-bronze px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink">
      <Reveal className="mx-auto max-w-[820px] text-center">
        <div className="mb-4 font-mono text-xs tracking-[0.2em] text-merlot uppercase">
          {dict.sustainability.eyebrow}
        </div>
        <h2 className="m-0 font-display text-[clamp(34px,5.5vw,72px)] font-medium leading-none">
          {dict.sustainability.title}
        </h2>
      </Reveal>

      <div className="mx-auto mt-13 grid max-w-[1100px] gap-5 md:grid-cols-3">
        {dict.sustainability.cards.map((card) => (
          <Reveal key={card.figure} className="rounded-sm bg-linen px-7.5 py-8.5">
            <div className="font-display text-[52px] font-medium leading-none text-merlot">
              {card.figure}
            </div>
            <div className="mb-4.5 mt-1.5 font-mono text-[11px] tracking-[0.1em] text-stone uppercase">
              {card.unit}
            </div>
            <p className="m-0 text-[15px] leading-relaxed text-ink">{card.text}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-8.5 flex max-w-[1100px] flex-wrap items-center justify-center gap-4">
        {dict.sustainability.seals.map((seal) => (
          <div
            key={seal}
            className="rounded-md border border-dashed border-ink/40 px-5.5 py-4 font-mono text-[11px] text-ink"
          >
            [ {seal.toUpperCase()} ]
          </div>
        ))}
      </Reveal>
    </section>
  )
}
