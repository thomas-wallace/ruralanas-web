/**
 * Selecciones de la tienda: qué piezas van en "Exclusivos" y en "Carryover".
 *
 * Ni WooCommerce ni Dolibarr tienen un dato que diga esto, así que se elige a
 * mano acá. Se listan por slug (el de la URL de la ficha) y se muestran en este
 * orden. Un slug que no exista en el catálogo se ignora, y una selección vacía
 * desaparece de la tienda.
 *
 * "Best Sellers" no se elige: sale de las ventas registradas en Woo. Acá sólo
 * se fija cuántas piezas muestra.
 *
 * PROPUESTA del 04-11-2026, a confirmar por Ruralanas:
 *   · Exclusivos: las piezas con terminación de cuero y los modelos de serie
 *     corta.
 *   · Carryover: los modelos clásicos que siguen de una temporada a otra.
 */

export const BEST_SELLERS_COUNT = 6

export const CURATED_COLLECTIONS = {
  exclusivos: [
    'manta-merino-flame-con-etiqueta-de-cuero',
    'pie-de-cama-con-arnes-de-cuero',
    'manta-merino-con-cinto-de-cuero',
    'chaleco-victoria',
    'triangulo-pompon',
  ],
  carryover: [
    'ruana-clasica',
    'bufanda-clasica',
    'gorro-clasico',
    'pashmina-bufandon',
    'calcetines',
    'madeja-lana-merino',
  ],
} as const satisfies Record<string, readonly string[]>
