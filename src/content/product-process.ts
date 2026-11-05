/**
 * Datos del bloque "Proceso" de la ficha: técnica, horas de trabajo y talleres
 * que intervienen en cada pieza.
 *
 * El destino de estos datos son los extrafields y los costos de producción de
 * Dolibarr (Ola 1). Mientras el catálogo venga de Woo, se declaran acá.
 *
 * Regla: **sólo datos reales**. Lo que no se sabe se deja sin cargar y la ficha
 * no lo muestra; una cifra estimada sería un argumento de venta falso.
 *
 * · `technique`: sale de lo que dice la descripción de cada pieza en Woo
 *   (relevado el 04-11-2026). Sin técnica: la manta flamé, el sendero y la
 *   madeja y los calcetines no la mencionan.
 * · `hours` y `workshops`: los tiene que pasar Ruralanas. Hoy no hay ninguno.
 */

import type { Technique } from '@/lib/catalog/types'

export interface ProductProcess {
  technique?: Technique
  /** Horas de trabajo a mano de una pieza. */
  hours?: number
  /** Talleres (casas de artesanas) que intervienen en una pieza. */
  workshops?: number
}

export const PRODUCT_PROCESS: Record<string, ProductProcess> = {
  'gorro-merino': { technique: 'dos-agujas' },
  'gorro-clasico': { technique: 'dos-agujas' },
  'cuello-guantes': { technique: 'dos-agujas' },
  'triangulo-pompon': { technique: 'dos-agujas' },
  'bufanda-flame': { technique: 'telar' },
  'bufanda-clasica': { technique: 'telar' },
  'pie-de-cama-con-arnes-de-cuero': { technique: 'telar' },
  'manta-merino-con-cinto-de-cuero': { technique: 'telar' },
  'chaleco-merino': { technique: 'telar' },
  'chaleco-victoria': { technique: 'telar' },
  'ruana-liviana': { technique: 'telar' },
  'ruana-clasica': { technique: 'telar' },
  'pashmina-bufandon': { technique: 'telar' },
  'clara-la-ovejita': { technique: 'crochet' },
}
