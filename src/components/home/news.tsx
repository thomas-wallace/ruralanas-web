import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

export function News({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="noticias"
      className="bg-linen px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-ink"
    >
      <Reveal className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-4">
        <h2 className="m-0 font-display text-[clamp(32px,5vw,64px)] font-medium leading-none">
          {dict.news.title}
        </h2>
        <span className="border-b border-bronze pb-1 font-mono text-[13px] text-ink uppercase">
          {dict.news.cta} →
        </span>
      </Reveal>

      <div className="mx-auto mt-11 grid max-w-[1100px] gap-6 md:grid-cols-3">
        {dict.news.items.map((item) => (
          <Reveal as="article" key={item.title}>
            <PendingShot label="Foto" ratio="16/10" tone="light" align="center" className="mb-4.5" />
            <div className="mb-2 font-mono text-[11px] tracking-[0.1em] text-merlot uppercase">
              {item.tag}
            </div>
            <h3 className="m-0 font-display text-[22px] font-medium leading-tight">{item.title}</h3>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
