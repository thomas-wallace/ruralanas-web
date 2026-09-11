import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import type { Dictionary } from '@/lib/i18n'

/** Capítulo II. Acá el fondo pasa de la noche del campo al tono de la lana. */
export function ChapterHands({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="nosotros"
      className="relative px-[var(--spacing-gutter)] py-[clamp(80px,12vh,150px)]"
      style={{ background: 'linear-gradient(180deg,#1B1714 0%,#3a2c20 45%,#B28A5E 100%)' }}
    >
      <Reveal className="mx-auto max-w-[760px] text-center">
        <div className="mb-4.5 font-mono text-xs tracking-[0.2em] text-linen/65 uppercase">
          {dict.hands.eyebrow}
        </div>
        <h2 className="mb-5.5 font-display text-[clamp(38px,6vw,86px)] font-medium leading-none text-linen">
          {dict.hands.title}
        </h2>
        <p className="mx-auto max-w-[600px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-linen/85">
          {dict.hands.lead}
        </p>
      </Reveal>

      {/* `z-3`: misma regla que el video del capítulo I. El hilo de lana pasa
          por detrás de las fotos, no por encima. Hoy son marcos punteados y se
          nota poco; con la foto real puesta, una hebra cruzándola sería
          exactamente lo que hay que evitar. */}
      <Reveal className="relative z-3 mx-auto mt-13 grid max-w-[1100px] gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
        {dict.hands.shots.map((shot, index) => (
          <PendingShot
            key={shot}
            label={shot}
            ratio="3/4"
            tone="warm"
            className={index === 1 ? 'mt-0 lg:mt-12' : ''}
          />
        ))}
      </Reveal>
    </section>
  )
}
