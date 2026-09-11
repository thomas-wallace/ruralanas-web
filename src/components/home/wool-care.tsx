import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

export function WoolCare({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-linen px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink">
      <Reveal className="mx-auto max-w-[760px] text-center">
        <div className="mb-4 font-mono text-xs tracking-[0.2em] text-bronze uppercase">
          {dict.care.eyebrow}
        </div>
        <h2 className="mb-3.5 font-display text-[clamp(32px,5vw,64px)] font-medium leading-none">
          {dict.care.title}
        </h2>
        <p className="mx-auto m-0 max-w-[520px] text-base leading-relaxed text-graphite">
          {dict.care.lead}
        </p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-[1000px] gap-6 sm:grid-cols-3">
        {dict.care.items.map((item) => (
          <Reveal key={item.title} className="text-center">
            <PendingShot
              label="Ilustración"
              ratio="1"
              tone="light"
              align="center"
              className="mb-4.5"
            />
            <h3 className="mb-2 font-display text-[22px] font-medium">{item.title}</h3>
            <p className="m-0 text-sm leading-relaxed text-graphite">{item.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
