import type { Review } from './types'

/**
 * Reseñas de muestra, para poder mirar el diseño antes de tener reseñas reales.
 *
 * ⚠️ **No son de nadie.** Existen para ver cómo se comporta la sección con
 * texto de largo variable, con y sin compra verificada, y con notas distintas
 * de cinco estrellas — que es justo lo que no se puede evaluar con la sección
 * vacía.
 *
 * Tres cosas las mantienen encerradas donde tienen que estar:
 *   1. sólo se activan con `REVIEWS_SOURCE=demo`;
 *   2. `src/lib/reviews/index.ts` **se niega a usarlas si NODE_ENV es
 *      production**, así que un despliegue con esta variable puesta por
 *      descuido cae igual a las reseñas de verdad;
 *   3. mientras están activas, la portada muestra un cartel de "datos de
 *      muestra" bien visible.
 *
 * Publicar testimonios inventados con nombre y apellido es afirmar algo falso
 * sobre un cliente. Estas nunca se cargan en WooCommerce.
 */
export const DEMO_REVIEWS: Review[] = [
  {
    id: 'demo-1',
    author: 'Camila R.',
    text: 'La ruana más suave que tuve. Se siente como un abrazo y no pica nada. La uso para trabajar y para salir, y todavía no se le hizo una sola pelusa.',
    rating: 5,
    publishedAt: '2026-08-21T15:00:00',
    verified: true,
    product: { id: 'demo-p1', name: 'Ruana Clásica', slug: 'ruana-clasica' },
  },
  {
    id: 'demo-2',
    author: 'Michael T.',
    text: 'Compré desde Estados Unidos y llegó impecable, muy bien embalada. Tardó dos semanas, lo cual me pareció razonable para algo tejido a mano.',
    rating: 5,
    publishedAt: '2026-07-30T15:00:00',
    verified: true,
    product: { id: 'demo-p2', name: 'Manta Merino Flamé', slug: 'manta-merino-con-cinto-de-cuero' },
  },
  {
    id: 'demo-3',
    author: 'Sophie L.',
    text: 'Hermosa y abrigada. Le pongo cuatro porque el talle me quedó más grande de lo que esperaba: conviene mirar bien las medidas antes de pedir.',
    rating: 4,
    publishedAt: '2026-07-11T15:00:00',
    verified: false,
    product: { id: 'demo-p3', name: 'Bufanda Clásica', slug: 'bufanda-clasica' },
  },
]
