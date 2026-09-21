'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Carril horizontal con scroll nativo (táctil, trackpad, rueda con shift) y
 * flechas para quien usa mouse. Cada hijo encaja con scroll-snap; las flechas
 * se deshabilitan en los extremos.
 */
export function ScrollRail({
  children,
  label,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode
  label: string
  prevLabel: string
  nextLabel: string
}) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    // Tolerancia de 2px: con zoom del navegador el scroll no llega al entero.
    setEdges({
      start: track.scrollLeft <= 2,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    measure()
    track.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      track.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const step = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  const arrow =
    'absolute top-[38%] z-2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-earth/20 bg-paper/90 text-earth transition-opacity hover:border-earth disabled:pointer-events-none disabled:opacity-0 md:flex'

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory list-none gap-[clamp(14px,2vw,24px)] overflow-x-auto scroll-smooth p-0"
      >
        {children}
      </ul>

      <button
        type="button"
        onClick={() => step(-1)}
        disabled={edges.start}
        aria-label={prevLabel}
        className={`${arrow} -left-5`}
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={edges.end}
        aria-label={nextLabel}
        className={`${arrow} -right-5`}
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}
