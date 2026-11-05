'use client'

import Image from 'next/image'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'

/**
 * Foto de la galería con zoom.
 *
 * Clic (o toque) amplía la foto en el punto donde se hizo; mientras está
 * ampliada, el puntero —o el dedo arrastrando— recorre la trama. Otro clic, o
 * sacar el mouse, la devuelve. Es para ver la fibra: en una pieza de lana el
 * argumento está en el detalle, y la foto entera no lo muestra.
 *
 * El zoom es una escala CSS sobre la misma imagen, que `next/image` ya sirve
 * al doble de resolución en pantallas densas: no se pide otra foto.
 */

const SCALE = 2.4

export function ZoomableImage({
  src,
  alt,
  sizes,
  priority = false,
  zoomInLabel,
  zoomOutLabel,
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  zoomInLabel: string
  zoomOutLabel: string
}) {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')

  // `PointerEvent` hereda de `MouseEvent`: sirve para el clic y para el movimiento.
  const follow = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOrigin('50% 50%')
      setZoomed((value) => !value)
    } else if (event.key === 'Escape') {
      setZoomed(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={zoomed}
      aria-label={zoomed ? zoomOutLabel : zoomInLabel}
      onClick={(event) => {
        follow(event)
        setZoomed((value) => !value)
      }}
      onPointerMove={(event) => zoomed && follow(event)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setZoomed(false)}
      onKeyDown={onKeyDown}
      // Ampliada, el dedo recorre la foto en vez de mover la página.
      style={{ touchAction: zoomed ? 'none' : 'auto' }}
      className={`group/zoom relative h-full w-full overflow-hidden outline-offset-2 ${
        zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        draggable={false}
        style={{ transformOrigin: origin, transform: zoomed ? `scale(${SCALE})` : 'none' }}
        className="object-cover transition-transform duration-300 ease-out select-none"
      />

      {/* Lupa: avisa que la foto se amplía. Se va mientras está ampliada. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-2.5 bottom-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-paper/85 text-earth transition-opacity ${
          zoomed ? 'opacity-0' : 'opacity-80 group-hover/zoom:opacity-100'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14M7 5v4M5 7h4" />
        </svg>
      </span>
    </div>
  )
}
