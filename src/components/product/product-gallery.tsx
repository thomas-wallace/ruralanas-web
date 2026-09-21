import Image from 'next/image'

import { PendingShot } from '@/components/ui/pending-shot'
import type { Product } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'

/**
 * Galería de la ficha.
 *
 * El módulo 08 pide tres tomas por producto: producto, detalle de textura y
 * foto de uso. Mientras falten, el hueco se muestra como hueco. Una tienda de
 * lujo se sostiene en la foto: disimular que no está no ayuda a producirla.
 */
export function ProductGallery({ product, dict }: { product: Product; dict: Dictionary }) {
  const [main] = product.images
  const extra = product.images.slice(1)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden bg-paper">
        {main ? (
          <Image
            src={main.src}
            alt={main.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        ) : (
          <PendingShot label={dict.product.gallerySoon} ratio="4/5" tone="light" align="center" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {extra.map((image) => (
          <div key={image.src} className="relative aspect-square overflow-hidden bg-paper">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 50vw, 280px"
              className="object-cover"
            />
          </div>
        ))}

        {extra.length === 0 && (
          <>
            <PendingShot label={dict.product.textureShot} ratio="1" tone="light" align="center" />
            <PendingShot label={dict.product.lifestyleShot} ratio="1" tone="light" align="center" />
          </>
        )}
      </div>
    </div>
  )
}
