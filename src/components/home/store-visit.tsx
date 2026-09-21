import { StoreVisitButton } from '@/components/home/store-visit-button'
import { PhotoFader } from '@/components/ui/photo-fader'
import { Reveal } from '@/components/ui/reveal'
import { homeContent } from '@/content/home'
import type { Dictionary } from '@/lib/i18n'

export function StoreVisit({ dict }: { dict: Dictionary }) {
  const { store } = dict

  return (
    <section className="bg-paper px-[var(--spacing-gutter)] py-[var(--spacing-section)] text-earth">
      <div className="mx-auto grid max-w-[1100px] items-center gap-[clamp(36px,6vw,96px)] md:grid-cols-2">
        <Reveal className="relative aspect-4/5 overflow-hidden bg-ash">
          <PhotoFader
            photos={homeContent.store.photos.map((photo) => ({ ...photo, alt: store.photoAlt }))}
            sizes="(max-width: 768px) 100vw, 540px"
          />
        </Reveal>

        <Reveal className="max-w-[420px]">
          <div className="text-[12px] tracking-[0.06em] text-slate uppercase">{store.eyebrow}</div>
          <h2 className="mb-5 mt-4 font-sans text-[clamp(20px,2vw,24px)] font-medium tracking-[0.02em] uppercase">
            {store.title}
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-slate">{store.text}</p>
          <address className="mt-5 text-[15px] not-italic leading-relaxed text-slate">
            {dict.footer.address}
            <br />
            {dict.footer.city}
          </address>
          <div className="mt-8">
            <StoreVisitButton
              label={store.cta}
              closeLabel={dict.nav.close}
              videoSrc={homeContent.store.video}
              pendingLabel={store.videoPending}
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
