/**
 * ⚠️ DATOS FICTICIOS, SÓLO PARA MOSTRAR EL BLOQUE "PROCESO" DE LA FICHA.
 *
 * Las horas reales de cada pieza llegan con los costos de producción de
 * Dolibarr; hasta entonces Woo no las trae y el bloque no se dibuja. Estas
 * cifras son inventadas para enseñar el diseño y no representan el trabajo
 * real de ninguna pieza.
 *
 * Sólo se aplican con `DEMO_HANDWORK_HOURS=1` (ver `src/lib/catalog/index.ts`).
 * Nunca activar esa variable en producción: publicar horas inventadas es un
 * argumento de venta falso. Borrar este archivo cuando lleguen las reales.
 */
export const DEMO_HANDWORK_HOURS: Record<string, number> = {
  'ruana-clasica': 16,
  'ruana-liviana': 12,
  'manta-merino-flame-con-etiqueta-de-cuero': 22,
  'pashmina-bufandon': 9,
  'chaleco-victoria': 14,
}
