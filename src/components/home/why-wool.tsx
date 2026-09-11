import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

export function WhyWool({ dict }: { dict: Dictionary }) {
  return (
    <section className="bg-linen px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink">
      <Reveal className="mx-auto max-w-[820px] text-center">
        <div className="mb-4 font-mono text-xs tracking-[0.2em] text-bronze uppercase">
          {dict.wool.eyebrow}
        </div>
        <h2 className="m-0 font-display text-[clamp(34px,5.5vw,72px)] font-medium leading-none">
          {dict.wool.title}
        </h2>
      </Reveal>

      <div className="mx-auto mt-13 grid max-w-[1100px] gap-px border border-stone/35 bg-stone/35 sm:grid-cols-2 lg:grid-cols-4">
        {dict.wool.features.map((feature) => (
          <Reveal key={feature.title} className="bg-linen px-7.5 py-9">
            <div className="mb-5 h-8.5 w-8.5 rounded-full border-[1.5px] border-merlot" />
            <h3 className="mb-2.5 font-display text-[23px] font-medium">{feature.title}</h3>
            <p className="m-0 text-[15px] leading-relaxed text-graphite">{feature.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
