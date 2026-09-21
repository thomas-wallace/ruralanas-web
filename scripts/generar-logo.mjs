/**
 * Deriva del logo maestro (`public/logo.png`) las piezas que el sitio usa.
 *
 *     node scripts/generar-logo.mjs
 *
 * Se corre cuando cambia el logo, no en cada build. Lo que produce se commitea.
 *
 * El maestro viene como el estudio lo entregó: el trazo en gris #373435 sobre
 * un fondo **blanco opaco**, no transparente. Puesto tal cual sobre `paper` o
 * `ash` se vería un recuadro blanco, así que acá se hacen dos cosas:
 *
 *  1. El blanco se vuelve transparencia. No es un recorte por umbral: el alfa
 *     sale de la luminancia de cada píxel, de modo que el antialiasing de las
 *     curvas —que en este logo es casi todo el dibujo— se conserva intacto.
 *  2. Se recortan los márgenes. El espacio alrededor del logo lo decide el
 *     componente que lo usa, no el archivo.
 *
 * El color **no se toca**: el logo es blanco y negro y así se usa. Por eso el
 * gris de arriba no sale de la paleta del sitio sino del propio archivo.
 *
 * Salidas:
 *   public/logo-ruralanas.png  isotipo + palabra, para el encabezado y el pie
 *   public/isotipo.png         sólo el huso, para espacios angostos
 *   src/app/icon.png           favicon; Next lo toma de esa ruta sin declararlo
 */

import { PNG } from 'pngjs'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * El gris del maestro, medido sobre el archivo. El logo es blanco y negro y se
 * queda así: no se tiñe con los colores de la paleta.
 */
const TINTA = [0x37, 0x34, 0x35]
/** El favicon conserva el fondo blanco del maestro. */
const FONDO_ICONO = [0xff, 0xff, 0xff]

/**
 * Luminancia de la tinta del maestro. El alfa se normaliza contra este valor
 * para que el trazo quede opaco: si se usara `255 - luminancia` a secas, un
 * gris #373435 daría 202 de alfa y el logo se vería lavado.
 */
const LUM_TINTA = 0.299 * TINTA[0] + 0.587 * TINTA[1] + 0.114 * TINTA[2]

const ICONO = 512
/** Cuánto del alto del favicon ocupa el huso. El resto es aire. */
const ICONO_OCUPACION = 0.66

// ---------------------------------------------------------------------------

const leer = (ruta) => PNG.sync.read(readFileSync(ruta))

const pixel = (img, x, y) => {
  const i = (img.width * y + x) << 2
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
}

const luminancia = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b

/** ¿Este píxel es trazo y no fondo? */
function esTinta(img, x, y) {
  const p = pixel(img, x, y)
  return p[3] > 60 && luminancia(p) < 200
}

/** Caja mínima que contiene todo el trazo, dentro de un rango de columnas. */
function cajaDeTinta(img, desdeX = 0, hastaX = img.width - 1) {
  let x0 = hastaX, y0 = img.height - 1, x1 = desdeX, y1 = 0
  for (let y = 0; y < img.height; y++) {
    for (let x = desdeX; x <= hastaX; x++) {
      if (!esTinta(img, x, y)) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return { x0, y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 }
}

/**
 * Primera columna en blanco lo bastante ancha como para ser la separación
 * entre el huso y la palabra, y no el espacio entre dos letras.
 */
function separacion(img, caja, minimo = 36) {
  let hueco = null
  for (let x = caja.x0; x < caja.x0 + caja.ancho; x++) {
    let vacia = true
    for (let y = 0; y < img.height && vacia; y++) if (esTinta(img, x, y)) vacia = false

    if (vacia) {
      hueco ??= x
    } else {
      if (hueco !== null && x - hueco >= minimo) return { fin: hueco - 1, siguiente: x }
      hueco = null
    }
  }
  return null
}

/** Recorta la caja y devuelve el trazo original sobre transparencia. */
function siluetaDe(img, caja) {
  const out = new PNG({ width: caja.ancho, height: caja.alto })
  for (let y = 0; y < caja.alto; y++) {
    for (let x = 0; x < caja.ancho; x++) {
      const p = pixel(img, caja.x0 + x, caja.y0 + y)
      // Se despeja la cobertura sabiendo que el maestro está compuesto sobre
      // blanco: pixel = tinta * a + 255 * (1 - a).
      const cobertura = (255 - luminancia(p)) / (255 - LUM_TINTA)
      const alfa = Math.max(0, Math.min(255, Math.round(cobertura * 255))) * (p[3] / 255)

      const i = (out.width * y + x) << 2
      out.data[i] = TINTA[0]
      out.data[i + 1] = TINTA[1]
      out.data[i + 2] = TINTA[2]
      out.data[i + 3] = Math.round(alfa)
    }
  }
  return out
}

/**
 * Reduce promediando el área de origen de cada píxel. Para un trazo fino como
 * éste, tomar el píxel más cercano dejaría los bordes dentados.
 */
function reducir(img, ancho, alto) {
  const out = new PNG({ width: ancho, height: alto })
  const escalaX = img.width / ancho
  const escalaY = img.height / alto

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      let suma = 0
      let n = 0
      const yi = Math.floor(y * escalaY)
      const yf = Math.max(yi + 1, Math.floor((y + 1) * escalaY))
      const xi = Math.floor(x * escalaX)
      const xf = Math.max(xi + 1, Math.floor((x + 1) * escalaX))

      for (let sy = yi; sy < Math.min(yf, img.height); sy++) {
        for (let sx = xi; sx < Math.min(xf, img.width); sx++) {
          suma += img.data[((img.width * sy + sx) << 2) + 3]
          n++
        }
      }

      const i = (ancho * y + x) << 2
      out.data[i] = TINTA[0]
      out.data[i + 1] = TINTA[1]
      out.data[i + 2] = TINTA[2]
      out.data[i + 3] = n ? Math.round(suma / n) : 0
    }
  }
  return out
}

/** El huso centrado sobre un cuadrado blanco, como el maestro. */
function favicon(isotipo) {
  const alto = Math.round(ICONO * ICONO_OCUPACION)
  const ancho = Math.round((alto * isotipo.width) / isotipo.height)
  const marca = reducir(isotipo, ancho, alto)

  const out = new PNG({ width: ICONO, height: ICONO })
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = FONDO_ICONO[0]
    out.data[i + 1] = FONDO_ICONO[1]
    out.data[i + 2] = FONDO_ICONO[2]
    out.data[i + 3] = 255
  }

  const offX = Math.round((ICONO - ancho) / 2)
  const offY = Math.round((ICONO - alto) / 2)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const a = marca.data[((ancho * y + x) << 2) + 3] / 255
      if (!a) continue
      const i = (ICONO * (offY + y) + (offX + x)) << 2
      // Mezcla manual: el PNG se guarda plano, sin alfa que componer después.
      for (let c = 0; c < 3; c++) {
        out.data[i + c] = Math.round(TINTA[c] * a + FONDO_ICONO[c] * (1 - a))
      }
    }
  }
  return out
}

const guardar = (img, ruta) => {
  writeFileSync(ruta, PNG.sync.write(img))
  const kb = (readFileSync(ruta).length / 1024).toFixed(0)
  console.log(`  ${ruta.replace(RAIZ, '').replace(/^[\\/]/, '')}  ${img.width}x${img.height}  ${kb} KB`)
}

function main() {
  const maestro = leer(join(RAIZ, 'public', 'logo.png'))
  console.log(`Maestro: ${maestro.width}x${maestro.height}`)

  const completo = cajaDeTinta(maestro)
  const corte = separacion(maestro, completo)
  if (!corte) throw new Error('No se encontró la separación entre el huso y la palabra')

  const cajaIsotipo = cajaDeTinta(maestro, completo.x0, corte.fin)
  console.log(`Huso hasta x=${corte.fin}, palabra desde x=${corte.siguiente}`)

  guardar(siluetaDe(maestro, completo), join(RAIZ, 'public', 'logo-ruralanas.png'))
  const isotipo = siluetaDe(maestro, cajaIsotipo)
  guardar(isotipo, join(RAIZ, 'public', 'isotipo.png'))
  guardar(favicon(isotipo), join(RAIZ, 'src', 'app', 'icon.png'))
}

main()
