import { Reveal } from '@/components/ui/reveal'
import { VideoScrub } from '@/components/ui/video-scrub'
import type { Dictionary } from '@/lib/i18n'

export function ChapterOrigin({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="origen"
      className="relative bg-ink px-[var(--spacing-gutter)] py-[clamp(80px,12vh,150px)]"
    >
      <Reveal className="mx-auto max-w-[760px] text-center">
        <div className="mb-4.5 font-mono text-xs tracking-[0.2em] text-merlot uppercase">
          {dict.origin.eyebrow}
        </div>
        <h2 className="mb-5.5 font-display text-[clamp(38px,6vw,86px)] font-medium leading-none text-linen">
          {dict.origin.title}
        </h2>
        <p className="mx-auto max-w-[600px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-linen/70">
          {dict.origin.lead}
        </p>
      </Reveal>

      <VideoScrub src="/media/campo-merino.mp4" caption={dict.origin.videoCaption} />

      <div className="relative mx-auto mt-[clamp(70px,10vh,120px)] max-w-[820px]">
        <Reveal className="mb-14 text-center font-mono text-xs tracking-[0.18em] text-bronze uppercase">
          {dict.origin.processTitle}
        </Reveal>

        <ol className="flex list-none flex-col gap-[clamp(36px,6vh,72px)] p-0">
          {dict.origin.steps.map((step, index) => (
            <Reveal as="li" key={step.title} className="grid gap-2 text-center">
              <div className="font-mono text-[13px] tracking-[0.1em] text-merlot">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="m-0 font-display text-[clamp(26px,3.4vw,40px)] font-medium text-linen">
                {step.title}
              </h3>
              <p className="mx-auto m-0 max-w-[440px] text-[15px] leading-relaxed text-linen/60">
                {step.text}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
