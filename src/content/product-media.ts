/**
 * Fotos de la ficha que Woo no clasifica o no tiene asociadas.
 *
 * La Store API devuelve las fotos de cada producto sin decir qué muestran. La
 * ficha necesita saberlo: la foto en uso va segunda en la galería y es la que
 * aparece al pasar el mouse por la tarjeta; la de textura lleva zoom; la de la
 * caja de regalo no sirve como segunda foto de la tarjeta.
 *
 * Relevado el 04-11-2026 sobre la biblioteca de medios de ruralanas.com.
 */

import type { ProductImage } from '@/lib/catalog/types'

const UPLOADS = 'https://ruralanas.com/wp-content/uploads'

/**
 * Qué muestra cada foto que ya está cargada en Woo, reconocida por un trozo de
 * su nombre de archivo. Lo que no aparece acá se toma como foto de producto.
 */
export const IMAGE_KIND_BY_FILENAME: ReadonlyArray<{
  match: string
  kind: Exclude<ProductImage['kind'], 'product'>
}> = [
  { match: 'Guantes-100-lana-detalle', kind: 'texture' },
  { match: 'bufanda-flamee-100-lana-4-de-5', kind: 'texture' },
  { match: 'MANTA-FLAME-detalle', kind: 'texture' },
  { match: 'MANTA-CON-ETIQUETA-3', kind: 'texture' },
  { match: 'merino-flamee-1-of-1', kind: 'texture' },
  { match: 'Cuello-y-Guante-box', kind: 'packaging' },
  { match: 'gorro-clasico-100-lana-1-de-11', kind: 'packaging' },
  { match: 'bufanda-clasica-100-lana-13-de-13', kind: 'packaging' },
  { match: 'bufanda-flamee-100-lana-5-de-5', kind: 'packaging' },
  { match: 'ME-RI-NO-52', kind: 'packaging' },
]

/**
 * Fotos en uso de la sesión con modelos. Están en la biblioteca de medios de
 * WordPress pero no asociadas a ningún producto, así que Woo no las devuelve.
 *
 * PROPUESTA a confirmar por Ruralanas: la asignación se hizo comparando cada
 * foto con la de producto. El color de la foto puede no estar entre los que se
 * venden hoy (las medias verdes, el triángulo azul marino): es el mismo modelo.
 * Las dos ruanas son las de menor certeza.
 *
 * Para sumar una foto: subirla a WordPress y agregar su URL acá. Cuando la foto
 * se asocie al producto en Woo, sobra la línea y alcanza con su `match` arriba.
 */
export const EXTRA_PRODUCT_IMAGES: Record<
  string,
  ReadonlyArray<{ src: string; kind: 'lifestyle' | 'texture' }>
> = {
  'ruana-liviana': [
    { src: `${UPLOADS}/Viviana-_-ruana-turquesa-1.png`, kind: 'lifestyle' },
    { src: `${UPLOADS}/Viviana-_-ruana-turquesa-2.png`, kind: 'lifestyle' },
    { src: `${UPLOADS}/Viviana-_-ruana-turquesa-3.png`, kind: 'texture' },
  ],
  'ruana-clasica': [
    { src: `${UPLOADS}/Viviana-_-ruana-aquam-1.png`, kind: 'lifestyle' },
    { src: `${UPLOADS}/Viviana-_-ruana-aquam-2.png`, kind: 'lifestyle' },
  ],
  'chaleco-victoria': [
    { src: `${UPLOADS}/DSC09390-ED.jpg`, kind: 'lifestyle' },
    { src: `${UPLOADS}/DSC09409-ED.png`, kind: 'lifestyle' },
  ],
  'chaleco-merino': [{ src: `${UPLOADS}/DSC09409-ED.png`, kind: 'lifestyle' }],
  'triangulo-pompon': [
    { src: `${UPLOADS}/DSC09362-editada.jpg`, kind: 'lifestyle' },
    { src: `${UPLOADS}/DSC09358-editada.jpg`, kind: 'lifestyle' },
  ],
  'pashmina-bufandon': [{ src: `${UPLOADS}/DSC09476.jpg.jpg`, kind: 'lifestyle' }],
  calcetines: [{ src: `${UPLOADS}/medias-verdes.jpg`, kind: 'lifestyle' }],
}
