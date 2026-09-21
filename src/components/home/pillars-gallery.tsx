import Image from 'next/image'
import Link from 'next/link'

import { PendingShot } from '@/components/ui/pending-shot'
import { Reveal } from '@/components/ui/reveal'
import { homeContent } from '@/content/home'
import type { Dictionary, Locale } from '@/lib/i18n'
import { routes } from '@/lib/routes'

/**
 * Cuatro paneles a sangre con foto, título y botón: repite la idea de los
 * pilares de arriba, pero contada con imágenes.
 */
export function PillarsGallery({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section aria-label={dict.gallery.ariaLabel} className="bg-earth">
      <ul className="grid list-none p-0 sm:grid-cols-2 lg:grid-cols-4">
        {dict.gallery.items.map((item, index) => {
          // Sin foto cargada en `content/home.ts`, el panel muestra el marco pendiente.
          const photo = homeContent.gallery.photos[index] ?? null

          return (
            <Reveal
              as="li"
              key={item.section}
              delayMs={index * 90}
              className="relative aspect-4/5 overflow-hidden lg:aspect-[5/8]"
            >
              {photo ? (
                <Image
                  src={photo}
                  alt={item.photoAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <PendingShot
                  label={item.shot}
                  ratio="auto"
                  tone="dark"
                  align="center"
                  className="absolute inset-0 !items-start pt-[20%]"
                />
              )}

              {/* Degradado para que el texto blanco se lea sobre cualquier foto. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-earth/70 via-earth/15 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-[clamp(28px,4vw,44px)] text-center">
                <h3 className="m-0 max-w-[260px] text-[15px] font-normal leading-snug tracking-[0.04em] text-paper uppercase">
                  {item.title}
                </h3>
                <Link
                  href={routes.about(locale, item.section)}
                  className="mt-5 border border-paper/85 px-5 py-2.5 text-[11px] tracking-[0.06em] text-paper uppercase transition-colors hover:bg-paper hover:text-earth"
                >
                  {item.cta}
                </Link>
              </div>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}
