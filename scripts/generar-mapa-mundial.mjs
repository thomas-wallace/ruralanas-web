/**
 * Genera `src/lib/world/geometry.ts`: la silueta del mundo como paths SVG,
 * uno por país, indexados por código ISO 3166-1 alfa-2.
 *
 * Se corre a mano cuando haya que regenerar el mapa, no en cada build:
 *
 *     node scripts/generar-mapa-mundial.mjs
 *
 * Por qué así y no con una librería de mapas: el storefront no tiene ninguna
 * dependencia de UI y no conviene que la primera sea un mapa. Las fronteras del
 * mundo son dato estático, así que se resuelven en tiempo de generación y el
 * navegador recibe SVG ya listo, sin JavaScript de mapas.
 *
 * Fuentes (dominio público / MIT, se descargan al vuelo):
 *  - Natural Earth 110m vía world-atlas: la geometría.
 *  - ISO-3166-Countries-with-Regional-Codes: el puente entre el id numérico que
 *    usa Natural Earth y el alfa-2 con el que trabaja el resto del código (el
 *    checkout ya usa alfa-2).
 *
 * Relevado el 20-09-2026: 110m trae 177 países. Los micro-estados (Singapur,
 * Malta, Andorra…) no tienen polígono a esta resolución; para esos el mapa
 * dibuja un nodo con las coordenadas que se declaren en el contenido.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const ISO_URL =
  'https://cdn.jsdelivr.net/gh/lukes/ISO-3166-Countries-with-Regional-Codes@master/all/all.json'

/** La Antártida no aporta nada al relato y desequilibra el encuadre. */
const EXCLUIR = new Set(['AQ'])

/** Alto del lienzo proyectado. El ancho lo decide la proyección. */
const ALTO = 460
/** Un decimal en el path: a este tamaño es medio píxel y ahorra la mitad del archivo. */
const DECIMALES = 1
/** Anillos más chicos que esto (px²) se descartan, salvo que sean el único del país. */
const AREA_MINIMA = 1.2

// ---------------------------------------------------------------------------
// Proyección Robinson
// ---------------------------------------------------------------------------

/**
 * Robinson es un compromiso: no conserva áreas ni ángulos, pero es la que mejor
 * se lee como mapamundi. Mercator quedaba descartada porque agranda Groenlandia
 * y Europa a costa de Sudamérica y África, justo al revés de lo que este mapa
 * quiere contar.
 *
 * Tabla oficial, un valor cada 5° de latitud.
 */
const ROBINSON_X = [
  1.0, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962,
  0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322,
]
const ROBINSON_Y = [
  0.0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176,
  0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1.0,
]

function interpolar(tabla, grados) {
  const i = Math.min(Math.floor(grados / 5), 17)
  const t = (grados - i * 5) / 5
  return tabla[i] + (tabla[i + 1] - tabla[i]) * t
}

/** Coordenadas en el espacio de la proyección, antes de escalar al lienzo. */
function robinson(lon, lat) {
  const abs = Math.min(Math.abs(lat), 90)
  const signo = lat < 0 ? -1 : 1
  return [
    (0.8487 * interpolar(ROBINSON_X, abs) * (lon * Math.PI)) / 180,
    1.3523 * interpolar(ROBINSON_Y, abs) * signo,
  ]
}

/** Extremos de la proyección, para encajar el mundo entero en el lienzo. */
const [ANCHO_PROY] = robinson(180, 0)
const [, ALTO_PROY] = robinson(0, 90)
const ESCALA = ALTO / (2 * ALTO_PROY)
const ANCHO = Math.round(2 * ANCHO_PROY * ESCALA)

function proyectar(lon, lat) {
  const [x, y] = robinson(lon, lat)
  return [ANCHO / 2 + x * ESCALA, ALTO / 2 - y * ESCALA]
}

// ---------------------------------------------------------------------------
// TopoJSON → anillos de coordenadas
// ---------------------------------------------------------------------------

/**
 * TopoJSON guarda los arcos una sola vez y en deltas sobre una grilla entera.
 * Decodificarlo es sumar los deltas y aplicar `transform`: veinte líneas que
 * nos ahorran la dependencia de `topojson-client`.
 */
function decodificarArcos(topologia) {
  const { scale, translate } = topologia.transform
  return topologia.arcs.map((arco) => {
    let x = 0
    let y = 0
    return arco.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
    })
  })
}

/** Un índice negativo significa "el mismo arco, recorrido al revés". */
function armarLinea(indices, arcos) {
  const puntos = []
  for (const indice of indices) {
    const arco = indice < 0 ? [...arcos[~indice]].reverse() : arcos[indice]
    // El último punto de un arco es el primero del siguiente: no se repite.
    puntos.push(...(puntos.length ? arco.slice(1) : arco))
  }
  return puntos
}

function anillosDe(geometria, arcos) {
  if (geometria.type === 'Polygon') return geometria.arcs.map((a) => armarLinea(a, arcos))
  if (geometria.type === 'MultiPolygon')
    return geometria.arcs.flatMap((poligono) => poligono.map((a) => armarLinea(a, arcos)))
  return []
}

// ---------------------------------------------------------------------------
// Anillos → path SVG
// ---------------------------------------------------------------------------

function area(puntos) {
  let suma = 0
  for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
    suma += puntos[j][0] * puntos[i][1] - puntos[i][0] * puntos[j][1]
  }
  return Math.abs(suma / 2)
}

const redondear = (n) => Number(n.toFixed(DECIMALES))

/**
 * Anillos que cruzan el antimeridiano (Rusia y Fiji a esta resolución).
 *
 * Natural Earth los guarda saltando de +180 a -180 en un solo segmento. Si se
 * proyecta tal cual, ese segmento se dibuja como una franja que atraviesa el
 * mapa entero de lado a lado. La salida es desenrollar las longitudes para que
 * la línea vuelva a ser continua —aunque se salga del rango [-180, 180]— y
 * emitir además la copia desplazada 360°, que es la que aparece por el otro
 * borde. Lo que sobra de cada copia lo recorta el `viewBox`.
 */
function partirAntimeridiano(anillo) {
  const cruza = anillo.some(
    (punto, i) => i > 0 && Math.abs(punto[0] - anillo[i - 1][0]) > 180,
  )
  if (!cruza) return [anillo]

  const continuo = [anillo[0]]
  let offset = 0
  for (let i = 1; i < anillo.length; i++) {
    const delta = anillo[i][0] - anillo[i - 1][0]
    if (delta > 180) offset -= 360
    else if (delta < -180) offset += 360
    continuo.push([anillo[i][0] + offset, anillo[i][1]])
  }

  const lons = continuo.map(([lon]) => lon)
  const copias = [continuo]
  if (Math.max(...lons) > 180) copias.push(continuo.map(([lon, lat]) => [lon - 360, lat]))
  if (Math.min(...lons) < -180) copias.push(continuo.map(([lon, lat]) => [lon + 360, lat]))
  return copias
}

function pathDe(anillos) {
  const proyectados = anillos
    .flatMap(partirAntimeridiano)
    .map((anillo) => anillo.map(([lon, lat]) => proyectar(lon, lat).map(redondear)))
    // Puntos que caen en el mismo píxel no aportan forma, sólo bytes.
    .map((anillo) =>
      anillo.filter(([x, y], i) => i === 0 || x !== anillo[i - 1][0] || y !== anillo[i - 1][1]),
    )
    .filter((anillo) => anillo.length >= 4)

  if (!proyectados.length) return ''

  // Islas minúsculas fuera, pero nunca el único anillo de un país isleño.
  const mayor = Math.max(...proyectados.map(area))
  const utiles = proyectados.filter((anillo) => area(anillo) >= Math.min(AREA_MINIMA, mayor))

  return utiles
    .map((anillo) => {
      const cuerpo = anillo
        .slice(1)
        .map(([x, y]) => `${x} ${y}`)
        .join('L')
      return `M${anillo[0][0]} ${anillo[0][1]}L${cuerpo}Z`
    })
    .join('')
}

// ---------------------------------------------------------------------------

async function bajar(url) {
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`${url} respondió ${respuesta.status}`)
  return respuesta.json()
}

async function main() {
  console.log('Bajando geometría y tabla ISO…')
  const [topologia, iso] = await Promise.all([bajar(ATLAS_URL), bajar(ISO_URL)])

  const alfa2PorNumero = new Map(
    iso.map((fila) => [String(Number(fila['country-code'])), fila['alpha-2']]),
  )

  const arcos = decodificarArcos(topologia)
  const paths = []
  const sinCodigo = []

  for (const geometria of topologia.objects.countries.geometries) {
    const codigo = alfa2PorNumero.get(String(Number(geometria.id)))
    if (!codigo) {
      sinCodigo.push(geometria.properties?.name ?? geometria.id)
      continue
    }
    if (EXCLUIR.has(codigo)) continue

    const d = pathDe(anillosDe(geometria, arcos))
    if (d) paths.push([codigo, d])
  }

  paths.sort(([a], [b]) => a.localeCompare(b))

  if (sinCodigo.length) console.log('Sin alfa-2 (se omiten):', sinCodigo.join(', '))
  console.log(`${paths.length} países con polígono.`)

  const hoy = new Date().toISOString().slice(0, 10)
  const cuerpo = paths.map(([codigo, d]) => `  ${codigo}: '${d}',`).join('\n')

  const salida = [
    '/**',
    ' * ARCHIVO GENERADO — no editar a mano.',
    ' *',
    ' * Lo produce `scripts/generar-mapa-mundial.mjs` desde Natural Earth 110m.',
    ' * Para cambiar el mapa se cambia el script y se vuelve a correr:',
    ' *',
    ' *     node scripts/generar-mapa-mundial.mjs',
    ' *',
    ' * Los países van indexados por ISO 3166-1 alfa-2, el mismo código que usa el',
    ' * checkout. A esta resolución faltan los micro-estados: el mapa los representa',
    ' * con un nodo en lugar de un polígono.',
    ' *',
    ` * Generado el ${hoy} · ${paths.length} países · proyección Robinson.`,
    ' */',
    '',
    '/** Lienzo de la proyección. Todo el resto del mapa se mide contra esto. */',
    `export const MAP_VIEWBOX = { width: ${ANCHO}, height: ${ALTO} } as const`,
    '',
    'const ROBINSON_X = ' + JSON.stringify(ROBINSON_X),
    'const ROBINSON_Y = ' + JSON.stringify(ROBINSON_Y),
    '',
    'function interpolar(tabla: readonly number[], grados: number): number {',
    '  const i = Math.min(Math.floor(grados / 5), 17)',
    '  const t = (grados - i * 5) / 5',
    '  // `?? 0` es para el tipado estricto: `i` nunca se sale de la tabla.',
    '  const desde = tabla[i] ?? 0',
    '  const hasta = tabla[i + 1] ?? desde',
    '  return desde + (hasta - desde) * t',
    '}',
    '',
    '/**',
    ' * Proyecta un punto geográfico al lienzo, con la misma Robinson con la que se',
    ' * generaron los paths. Sirve para los nodos: tiendas físicas y países que a',
    ' * esta resolución no tienen polígono.',
    ' */',
    'export function projectPoint(lon: number, lat: number): { x: number; y: number } {',
    '  const abs = Math.min(Math.abs(lat), 90)',
    '  const signo = lat < 0 ? -1 : 1',
    '  const x = (0.8487 * interpolar(ROBINSON_X, abs) * (lon * Math.PI)) / 180',
    '  const y = 1.3523 * interpolar(ROBINSON_Y, abs) * signo',
    '  return {',
    `    x: MAP_VIEWBOX.width / 2 + x * ${ESCALA},`,
    `    y: MAP_VIEWBOX.height / 2 - y * ${ESCALA},`,
    '  }',
    '}',
    '',
    '/** Silueta de cada país, lista para el atributo `d` de un `<path>`. */',
    'export const COUNTRY_PATHS: Record<string, string> = {',
    cuerpo,
    '}',
    '',
  ].join('\n')

  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
  const destino = join(raiz, 'src', 'lib', 'world', 'geometry.ts')
  writeFileSync(destino, salida, 'utf8')

  const kb = (Buffer.byteLength(salida) / 1024).toFixed(0)
  console.log(`Escrito ${destino} (${kb} KB, lienzo ${ANCHO}×${ALTO}).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
