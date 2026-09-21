/**
 * Medios y referencias de la home.
 *
 * Los textos viven en los diccionarios (`lib/i18n`); acá está lo que no se
 * traduce: qué video, qué fotos y qué productos muestra cada sección. Cambiar
 * una foto o un producto destacado se hace en este archivo y en ningún otro.
 *
 * Las fotos van en `public/media`. Un valor `null` deja el espacio con el marco
 * de "foto pendiente" hasta que el material exista.
 */

export const homeContent = {
  hero: {
    /** Id del video de YouTube de fondo (se reproduce sin sonido y en loop). */
    youtubeId: 'GjAvKP7R8dY',
  },

  catalogPeek: {
    /** Cuántos productos destacados muestra el carril. */
    limit: 8,
    lines: {
      /** La foto de Deco es la principal de este producto de la tienda. */
      deco: { category: 'deco', productSlug: 'manta-merino-flame-con-etiqueta-de-cuero' },
      /** Todavía no hay categoría de cuero en la tienda: `null` lleva a la tienda entera. */
      leather: { category: null, image: '/media/cartera-cuero.jpg' },
    },
  },

  store: {
    /** Fotos del local, en el orden en que se pasan. `position` elige el recorte. */
    photos: [{ src: '/media/foto-local.jpg', position: 'center 62%' }],
    /** Recorrido en video. `null` hasta que exista el archivo. */
    video: null as string | null,
  },

  gallery: {
    /** Una foto por panel, en el orden de `dict.gallery.items`. */
    photos: [null, null, null, null] as (string | null)[],
  },

  news: {
    /** Cuántas notas del blog muestra la home. */
    limit: 3,
  },
} as const
