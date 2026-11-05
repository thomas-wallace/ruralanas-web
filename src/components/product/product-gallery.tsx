import { PendingShot } from '@/components/ui/pending-shot'
import type { Product, ProductImage } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'

import { ZoomableImage } from './zoomable-image'

/**
 * Galería de la ficha.
 *
 * El módulo 08 pide tres tomas por producto: producto, detalle de textura y
 * foto de uso. El repositorio ya las entrega en ese orden —principal, en uso,
 * textura, el resto y la caja de regalo— y la galería sólo las nombra. Todas
 * se pueden ampliar: la de textura es la que más lo pide.
 *
 * Mientras falten, el hueco se muestra como hueco. Una tienda de lujo se
 * sostiene en la foto: disimular que no está no ayuda a producirla.
 */
export function ProductGallery({ product, dict }: { product: Product; dict: Dictionary }) {
  const [main, ...extra] = product.images

  const tag: Partial<Record<ProductImage['kind'], string>> = {
    lifestyle: dict.product.lifestyleTag,
    texture: dict.product.textureTag,
  }

  const zoom = (image: ProductImage, sizes: string, priority = false) => (
    <ZoomableImage
      src={image.src}
      alt={image.alt}
      sizes={sizes}
      priority={priority}
      zoomInLabel={`${dict.product.zoomIn}: ${image.alt}`}
      zoomOutLabel={`${dict.product.zoomOut}: ${image.alt}`}
    />
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden bg-paper">
        {main ? (
          zoom(main, '(max-width: 1024px) 100vw, 680px', true)
        ) : (
          <PendingShot label={dict.product.gallerySoon} ratio="4/5" tone="light" align="center" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 4/5 como la principal: las fotos en uso son verticales y en un
            cuadrado se pierde la cabeza o los pies. */}
        {extra.map((image) => (
          <div key={image.src} className="relative aspect-4/5 overflow-hidden bg-paper">
            {zoom(image, '(max-width: 1024px) 50vw, 340px')}
            {tag[image.kind] && (
              <span className="pointer-events-none absolute top-2.5 left-2.5 bg-paper/90 px-2 py-1 font-sans text-[10px] tracking-[0.16em] text-earth uppercase">
                {tag[image.kind]}
              </span>
            )}
          </div>
        ))}

        {extra.length === 0 && (
          <>
            <PendingShot label={dict.product.textureShot} ratio="4/5" tone="light" align="center" />
            <PendingShot label={dict.product.lifestyleShot} ratio="4/5" tone="light" align="center" />
          </>
        )}
      </div>
    </div>
  )
}
