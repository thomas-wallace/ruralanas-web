'use client'

/**
 * "El hilo": una hebra serpenteante que se va dibujando con el scroll y que
 * lleva un ovillo de lana adelante, desde el final del hero hasta la banda de
 * estadísticas. Es el recurso que cose la home entera en un solo relato.
 *
 * Portado del prototipo. El ovillo se dibuja con un generador pseudoaleatorio
 * de semilla fija: el mismo dibujo en el servidor y en el cliente, sin
 * diferencias de hidratación.
 *
 * ## Regla de capas — importante al agregar secciones
 *
 * El hilo se dibuja en `z-2` sobre TODA la página. La hebra tiene que *coser*
 * la home, no taparla: por eso **todo bloque de imagen o video lleva `z-3`** y
 * el hilo le pasa por debajo, desapareciendo al entrar y volviendo a asomar al
 * salir. Sin ese `z-3`, la hebra y el ovillo quedan flotando sobre la foto,
 * que es el error que salta a la vista.
 *
 * Hoy llevan `z-3`:
 *   · el video del campo (`VideoScrub`, capítulo I);
 *   · la grilla de fotos del capítulo II;
 *   · la banda de cifras (`StatsBand`), donde el hilo termina de meterse.
 *
 * El texto, en cambio, se deja por debajo a propósito: la hebra cruzándolo es
 * parte del recurso.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const BALL_RADIUS = 17

interface Winding {
  cx: number
  cy: number
  rx: number
  ry: number
  stroke: string
  width: number
  opacity: number
  rotate: number
}

function buildWindings(): Winding[] {
  let seed = 11
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  return Array.from({ length: 34 }, () => {
    const rx = 4 + random() * 13
    const cx = (random() - 0.5) * BALL_RADIUS * 0.55
    const cy = (random() - 0.5) * BALL_RADIUS * 0.45
    const ry = BALL_RADIUS - 1 - random() * 5
    const shade = random()

    return {
      cx: Number(cx.toFixed(1)),
      cy: Number(cy.toFixed(1)),
      rx: Number(rx.toFixed(1)),
      ry: Number(ry.toFixed(1)),
      stroke: shade > 0.62 ? '#e23a56' : shade > 0.3 ? '#8f0f22' : '#6d0a1a',
      width: Number((1 + random()).toFixed(2)),
      opacity: Number((0.7 + random() * 0.3).toFixed(2)),
      rotate: Number((random() * 180).toFixed(1)),
    }
  })
}

const WINDINGS = buildWindings()

interface Geometry {
  width: number
  height: number
  path: string
  startY: number
  endY: number
}

export function ThreadTrail({ startId, endId }: { startId: string; endId: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<SVGPathElement>(null)
  const ballRef = useRef<SVGGElement>(null)
  const spinnerRef = useRef<SVGGElement>(null)
  const lengthRef = useRef(0)
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  // Medir y trazar. Se recalcula cuando cambia la altura del contenedor:
  // las fuentes y las imágenes al cargar mueven todo hacia abajo.
  useLayoutEffect(() => {
    const host = hostRef.current
    const wrap = host?.parentElement
    if (!wrap) return

    const build = () => {
      const width = wrap.clientWidth
      const height = wrap.scrollHeight
      const startEl = document.getElementById(startId)
      const endEl = document.getElementById(endId)
      const startY = startEl ? startEl.offsetTop : Math.round(height * 0.12)
      // Termina 60px dentro de la banda de estadísticas: esa sección tiene
      // z-index mayor, así que el ovillo desaparece por debajo.
      const endY = endEl ? endEl.offsetTop + 60 : height - 120

      const cx = width / 2
      const amplitude = Math.min(26, width * 0.03)
      const wavelength = 320
      let path = ''
      for (let y = startY; y <= endY; y += 10) {
        const x = cx + amplitude * Math.sin(((y - startY) / wavelength) * Math.PI * 2)
        path += `${path ? ' L ' : 'M '}${x.toFixed(1)} ${y}`
      }

      setGeometry({ width, height, path, startY, endY })
    }

    build()

    let timer: ReturnType<typeof setTimeout>
    const observer =
      'ResizeObserver' in window
        ? new ResizeObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(build, 150)
          })
        : null
    observer?.observe(wrap)

    return () => {
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [startId, endId])

  // Avance del dibujo con el scroll.
  useEffect(() => {
    const draw = drawRef.current
    if (!geometry || !draw) return

    const total = draw.getTotalLength()
    lengthRef.current = total
    draw.style.strokeDasharray = String(total)
    draw.style.strokeDashoffset = String(total)

    let ticking = false

    const update = () => {
      const scrollTop = window.scrollY
      const span = geometry.endY - geometry.startY || 1
      const progress = Math.max(
        0,
        Math.min(1, (scrollTop + window.innerHeight * 0.5 - geometry.startY) / span),
      )

      draw.style.strokeDashoffset = String(total * (1 - progress))

      const ball = ballRef.current
      const spinner = spinnerRef.current
      if (ball && spinner) {
        const at = Math.max(0.5, Math.min(total - 0.5, total * progress))
        const point = draw.getPointAtLength(at)
        ball.setAttribute('transform', `translate(${point.x.toFixed(1)},${point.y.toFixed(1)})`)
        spinner.setAttribute('transform', `rotate(${((at / BALL_RADIUS) * (180 / Math.PI)).toFixed(1)})`)
        ball.style.opacity = progress > 0.004 && progress < 0.999 ? '1' : '0'
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [geometry])

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true">
      {geometry && (
        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="absolute left-0 top-0 opacity-40"
        >
          <defs>
            <clipPath id="rl-ovillo-clip">
              <circle r={BALL_RADIUS} />
            </clipPath>
          </defs>

          <path
            d={geometry.path}
            fill="none"
            stroke="#6D2433"
            strokeWidth="2"
            strokeDasharray="2 8"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            ref={drawRef}
            d={geometry.path}
            fill="none"
            stroke="#B4132E"
            strokeWidth="3"
            strokeLinecap="round"
          />

          <g ref={ballRef} style={{ opacity: 0 }}>
            <ellipse
              cx={0}
              cy={BALL_RADIUS + 6}
              rx={BALL_RADIUS * 0.85}
              ry={4}
              fill="rgba(0,0,0,.35)"
            />
            <g ref={spinnerRef}>
              <circle r={BALL_RADIUS} fill="#B4132E" />
              <g clipPath="url(#rl-ovillo-clip)">
                {WINDINGS.map((winding, index) => (
                  <ellipse
                    key={index}
                    cx={winding.cx}
                    cy={winding.cy}
                    rx={winding.rx}
                    ry={winding.ry}
                    fill="none"
                    stroke={winding.stroke}
                    strokeWidth={winding.width}
                    opacity={winding.opacity}
                    transform={`rotate(${winding.rotate})`}
                  />
                ))}
                <circle
                  cx={-BALL_RADIUS * 0.34}
                  cy={-BALL_RADIUS * 0.34}
                  r={BALL_RADIUS * 0.42}
                  fill="rgba(255,235,235,.22)"
                />
              </g>
              <circle
                r={BALL_RADIUS}
                fill="none"
                stroke="#5c0714"
                strokeWidth={1.6}
                opacity={0.6}
              />
            </g>
          </g>
        </svg>
      )}
    </div>
  )
}
