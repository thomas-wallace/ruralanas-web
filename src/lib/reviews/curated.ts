import type { Review } from './types'

/**
 * Testimonios escritos a mano.
 *
 * Son el respaldo para cuando WooCommerce todavía no tiene reseñas cargadas, y
 * el punto de partida mientras se juntan las primeras.
 *
 * ⚠️ REGLA QUE NO SE NEGOCIA: acá sólo va **texto real de gente real**, con su
 * permiso. Los tres testimonios que había antes en el diccionario estaban
 * inventados y dos decían "Google" como origen: eso es atribuirle a Google una
 * reseña que nadie escribió, y se quitó. Un testimonio inventado no es un
 * placeholder de diseño, es una afirmación falsa sobre un cliente.
 *
 * Mientras esta lista esté vacía, la sección de la home no se muestra. Es el
 * comportamiento correcto: sin prueba social real, no hay prueba social.
 */
export const CURATED_REVIEWS: Review[] = [
  // Ejemplo de la forma que tiene que tener cada entrada. Descomentar y
  // reemplazar con una reseña real antes de publicar:
  //
  // {
  //   id: 'curada-01',
  //   author: 'Nombre y apellido, o nombre e inicial',
  //   text: 'El texto tal cual lo escribió, sin retocar.',
  //   rating: 5,
  //   publishedAt: '2026-08-14',
  //   verified: false,
  // },
]

export const curatedReviews = (): Review[] => CURATED_REVIEWS
