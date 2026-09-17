import { homeContent } from '@/content/home'
import type { Dictionary } from '@/lib/i18n'

const HERO_VIDEO_ID = homeContent.hero.youtubeId

// `loop` en YouTube sólo funciona si `playlist` repite el mismo id. `mute=1` es
// obligatorio: los navegadores bloquean el autoplay con sonido.
const HERO_VIDEO_SRC =
  `https://www.youtube-nocookie.com/embed/${HERO_VIDEO_ID}?` +
  new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: HERO_VIDEO_ID,
    controls: '0',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    iv_load_policy: '3',
    // Subtítulos apagados. YouTube igual los muestra si el visitante los tiene
    // activados en su cuenta: esa preferencia pesa más que el parámetro.
    cc_load_policy: '0',
    modestbranding: '1',
  }).toString()

export function Hero({ dict }: { dict: Dictionary }) {
  return (
    <header
      id="top"
      className="relative flex min-h-screen items-end overflow-hidden px-[var(--spacing-gutter)] pb-[clamp(120px,16vh,170px)]"
    >
      {/* Textura de fondo: se ve mientras carga el video, o si no carga. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(115deg,#14110e 0 34px,#191510 34px 68px)',
        }}
      />

      {/* Video del campo: decorativo, sin sonido y sin interacción. El contenedor usa
          unidades de contenedor para cubrir el header entero sin deformar el 16:9. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
        style={{ containerType: 'size' }}
        aria-hidden="true"
      >
        <iframe
          src={HERO_VIDEO_SRC}
          title={dict.hero.videoCaption}
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
          style={{ width: 'max(100cqw, 177.78cqh)', height: 'max(100cqh, 56.25cqw)' }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 70% 20%,rgba(178,138,94,.14),transparent 55%),linear-gradient(180deg,rgba(20,17,14,.45) 0%,rgba(20,17,14,.1) 40%,rgba(20,17,14,.92) 100%)',
        }}
      />

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
    </header>
  )
}
