import { PendingShot } from '@/components/ui/pending-shot'
import type { Dictionary } from '@/lib/i18n'

export function Hero({ dict }: { dict: Dictionary }) {
  return (
    <header
      id="top"
      className="relative flex min-h-screen items-end overflow-hidden px-[var(--spacing-gutter)] pb-[clamp(120px,16vh,170px)]"
    >
      {/* Textura de fondo hasta que exista el video del campo. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(115deg,#14110e 0 34px,#191510 34px 68px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 70% 20%,rgba(178,138,94,.14),transparent 55%),linear-gradient(180deg,rgba(20,17,14,.45) 0%,rgba(20,17,14,.1) 40%,rgba(20,17,14,.92) 100%)',
        }}
      />

      <div className="absolute left-1/2 top-[70px] z-2 -translate-x-1/2 px-4">
        <PendingShot
          label={`Video full-bleed · ${dict.hero.videoCaption}`}
          ratio="auto"
          tone="dark"
          align="center"
          className="!aspect-auto rounded border-stone/50 px-3 py-2 text-center"
        />
      </div>

      <div className="relative z-3 max-w-[1000px]">
        <div className="mb-6 font-mono text-[13px] tracking-[0.22em] text-bronze uppercase">
          {dict.hero.eyebrow}
        </div>
        <h1 className="m-0 font-display text-[clamp(52px,9vw,140px)] font-medium leading-[0.95] tracking-[-0.02em] text-linen">
          {dict.hero.titleTop}
          <br />
          {dict.hero.titleBottom}
        </h1>
        <p className="mt-7 max-w-[540px] text-[clamp(16px,1.6vw,20px)] leading-relaxed text-linen/80">
          {dict.hero.lead}
        </p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-3 flex -translate-x-1/2 flex-col items-center gap-2.5 text-stone">
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase">{dict.hero.scroll}</span>
        <span
          className="animate-float block h-8 w-px"
          style={{ background: 'linear-gradient(#B28A5E,transparent)' }}
        />
      </div>
    </header>
  )
}
