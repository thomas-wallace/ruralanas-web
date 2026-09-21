'use client'

/**
 * La etiqueta que sigue al mouse sobre el mapa.
 *
 * Todo lo que necesita lo lee de los `data-` que puso el servidor, así que la
 * geometría del mapa no entra nunca al bundle del navegador. El realce del país
 * lo hace CSS por `:hover`; acá sólo se resuelve el texto y su posición.
 *
 * Con dedo no hay hover: en móvil no se muestra nada y el mapa queda como lo
 * que es, una imagen, con la leyenda y el conteo al lado.
 */

import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface Etiqueta {
  x: number
  y: number
  name: string
  status: string
}

export function MapHover({
  children,
  statusLabels,
}: {
  children: ReactNode
  statusLabels: Record<string, string>
}) {
  const marco = useRef<HTMLDivElement>(null)
  const [etiqueta, setEtiqueta] = useState<Etiqueta | null>(null)

  function alMover(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return

    const objetivo = (event.target as Element).closest('[data-country]')
    const caja = marco.current?.getBoundingClientRect()

    if (!objetivo || !caja) {
      setEtiqueta(null)
      return
    }

    setEtiqueta({
      x: event.clientX - caja.left,
      y: event.clientY - caja.top,
      name: objetivo.getAttribute('data-label') ?? '',
      status: objetivo.getAttribute('data-status') ?? 'none',
    })
  }

  return (
    <div
      ref={marco}
      className="relative"
      onPointerMove={alMover}
      onPointerLeave={() => setEtiqueta(null)}
    >
      {children}

      {etiqueta && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] rounded-sm border border-ash/15 bg-paper px-2.5 py-1.5 whitespace-nowrap shadow-[0_6px_18px_rgba(27,23,20,0.14)]"
          style={{ left: etiqueta.x, top: etiqueta.y }}
        >
          <span className="block font-sans text-[13px] leading-tight text-earth">
            {etiqueta.name}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] tracking-[0.1em] uppercase text-slate">
            {statusLabels[etiqueta.status] ?? statusLabels.none}
          </span>
        </div>
      )}
    </div>
  )
}
