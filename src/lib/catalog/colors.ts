/**
 * Colores de la carta de Ruralanas.
 *
 * Los nombres viven en WooCommerce como términos de `pa_color`; el valor
 * visual no está en ningún lado, así que se declara acá una sola vez. Son
 * aproximaciones de lana teñida, no colores de pantalla: sirven para
 * reconocer la variante, no para juzgar el tono. Por eso la muestra va siempre
 * acompañada del nombre.
 *
 * Un color que no esté en esta tabla no rompe nada: se dibuja neutro y se lee
 * por el nombre.
 */
export const COLOR_SWATCHES: Record<string, string> = {
  natural: '#E7DFCE',
  beige: '#D8C7AC',
  tostado: '#A9793F',
  mostaza: '#C69116',
  'coral-naranja': '#D96B3F',
  rojo: '#A81F26',
  merlot: '#6D2433',
  rosa: '#D99BA6',
  aguamarina: '#6FB1AC',
  verde: '#4F6B45',
  azul: '#33506E',
  gris: '#8A8880',
  negro: '#221F1C',
}

export function swatchFor(slug: string): string | null {
  return COLOR_SWATCHES[slug] ?? null
}
