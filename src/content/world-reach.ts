/**
 * Punto de partida del mapa de Nosotros → En el mundo.
 *
 * Desde que existe el admin (`/admin/mapa`), el mapa sale de dos fuentes:
 *   · la lista que se carga a mano en el admin, que la primera vez es la de
 *     este archivo, y
 *   · los países de los pedidos pagados, que WordPress anota solo (plugin
 *     `wordpress/ruralanas-contenido`): un país nuevo aparece sin que nadie lo
 *     cargue.
 * Este archivo sólo manda mientras nadie haya guardado el mapa en el admin.
 *
 * **País por país, nunca por continente ni por región.** "Europa" no es un dato:
 * se pinta Francia o no se pinta. Códigos ISO 3166-1 alfa-2, los del checkout.
 *
 * Relevado el 20-09-2026: los destinos que el checkout ya acepta hoy
 * (`components/checkout/countries.ts`).
 */

export const worldReachContent = {
  /** Fecha del relevamiento de esta lista. */
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
}

/**
 * Destinos que a la resolución del mapa (Natural Earth 110m) no tienen
 * polígono: micro-estados, islas y ciudades-estado. Se dibujan como un nodo en
 * estas coordenadas. Están todos de antemano porque una venta puede llegar de
 * cualquiera, y un país sin polígono ni nodo no se vería.
 */
export const COUNTRY_NODES: Record<string, { lat: number; lon: number }> = {
  AD: { lat: 42.51, lon: 1.52 }, // Andorra
  AG: { lat: 17.06, lon: -61.8 }, // Antigua y Barbuda
  AW: { lat: 12.52, lon: -69.97 }, // Aruba
  BB: { lat: 13.19, lon: -59.54 }, // Barbados
  BH: { lat: 26.07, lon: 50.56 }, // Baréin
  BM: { lat: 32.31, lon: -64.75 }, // Bermudas
  CV: { lat: 15.12, lon: -23.6 }, // Cabo Verde
  CW: { lat: 12.17, lon: -68.98 }, // Curazao
  DM: { lat: 15.41, lon: -61.37 }, // Dominica
  FO: { lat: 62.0, lon: -6.79 }, // Islas Feroe
  GD: { lat: 12.11, lon: -61.68 }, // Granada
  GG: { lat: 49.45, lon: -2.58 }, // Guernsey
  GI: { lat: 36.14, lon: -5.35 }, // Gibraltar
  HK: { lat: 22.32, lon: 114.17 }, // Hong Kong
  IM: { lat: 54.24, lon: -4.55 }, // Isla de Man
  JE: { lat: 49.21, lon: -2.13 }, // Jersey
  KM: { lat: -11.65, lon: 43.33 }, // Comoras
  KN: { lat: 17.36, lon: -62.78 }, // San Cristóbal y Nieves
  KY: { lat: 19.31, lon: -81.25 }, // Islas Caimán
  LC: { lat: 13.91, lon: -60.98 }, // Santa Lucía
  LI: { lat: 47.16, lon: 9.55 }, // Liechtenstein
  MC: { lat: 43.74, lon: 7.42 }, // Mónaco
  MO: { lat: 22.2, lon: 113.54 }, // Macao
  MT: { lat: 35.94, lon: 14.38 }, // Malta
  MU: { lat: -20.35, lon: 57.55 }, // Mauricio
  MV: { lat: 3.2, lon: 73.22 }, // Maldivas
  PF: { lat: -17.68, lon: -149.41 }, // Polinesia Francesa
  SC: { lat: -4.68, lon: 55.49 }, // Seychelles
  SG: { lat: 1.35, lon: 103.82 }, // Singapur
  SM: { lat: 43.94, lon: 12.46 }, // San Marino
  ST: { lat: 0.19, lon: 6.61 }, // Santo Tomé y Príncipe
  TO: { lat: -21.18, lon: -175.2 }, // Tonga
  VA: { lat: 41.9, lon: 12.45 }, // Ciudad del Vaticano
  VC: { lat: 13.25, lon: -61.2 }, // San Vicente y las Granadinas
  WS: { lat: -13.76, lon: -172.1 }, // Samoa
}
