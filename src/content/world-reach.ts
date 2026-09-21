/**
 * A dónde llegaron las prendas. Es el dato que pinta el mapa de la home.
 *
 * **País por país, nunca por continente ni por región.** "Europa" no es un dato:
 * se pinta Francia o no se pinta. Cada línea de `shipped` es un país concreto y
 * su código ISO 3166-1 alfa-2, el mismo que usa el checkout.
 *
 * ⚠️ PROVISIONAL — relevado el 20-09-2026. La lista son los destinos que el
 * checkout ya acepta hoy (`components/checkout/countries.ts`), que es el dato
 * más firme que existe en el repo. **Hay que confirmarla con el negocio antes
 * de publicar**: el mapa afirma "acá llegamos", y eso es una afirmación
 * comercial. Si a alguno todavía no se envió, se borra su línea y listo.
 *
 * Marcar un país nuevo es agregar su código acá. Nada más: el mapa, la leyenda
 * y el conteo salen de este archivo.
 *
 * Cuando exista el servicio de integración, este archivo se reemplaza por una
 * consulta a los pedidos de Dolibarr y deja de editarse a mano. El contrato
 * (`src/lib/world/types.ts`) ya está preparado para eso.
 */

export const worldReachContent = {
  /** Fecha del último relevamiento del dato. */
  asOf: '2026-09-20',

  /**
   * Locales propios. El país se pinta como alcanzado y además lleva un nodo
   * sobre la ciudad. Las coordenadas son de la ciudad, no del local exacto.
   */
  stores: [{ code: 'UY', city: 'Punta del Este', lat: -34.9667, lon: -54.95 }],

  /** Países con envíos. Alfabético por código, sin repetir los de `stores`. */
  shipped: [
    'AR', // Argentina
    'AT', // Austria
    'AU', // Australia
    'BE', // Bélgica
    'BR', // Brasil
    'CA', // Canadá
    'CH', // Suiza
    'CL', // Chile
    'CO', // Colombia
    'DE', // Alemania
    'DK', // Dinamarca
    'ES', // España
    'FI', // Finlandia
    'FR', // Francia
    'GB', // Reino Unido
    'IE', // Irlanda
    'IT', // Italia
    'JP', // Japón
    'MX', // México
    'NL', // Países Bajos
    'NO', // Noruega
    'NZ', // Nueva Zelanda
    'PE', // Perú
    'PT', // Portugal
    'PY', // Paraguay
    'SE', // Suecia
    'US', // Estados Unidos
  ],

  /**
   * Destinos que a la resolución del mapa no tienen polígono: micro-estados y
   * ciudades-estado. Se dibujan como nodo. Si alguno aparece en `shipped` sin
   * estar acá, la consola de desarrollo avisa.
   *
   * Ejemplo: { code: 'SG', lat: 1.35, lon: 103.82 }
   */
  shippedNodes: [] as { code: string; lat: number; lon: number }[],
} as const
