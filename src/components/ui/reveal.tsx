'use client'

/**
 * Aparición al entrar en pantalla. Portado del prototipo.
 *
 * Un único IntersectionObserver para todo el sitio: la home tiene más de
 * cuarenta bloques con reveal y no tiene sentido crear un observer por cada
 * uno. El estado inicial lo pone el CSS (`[data-reveal="hidden"]`), así que no
 * hay parpadeo durante la hidratación.
 */

import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

type Handler = () => void

let observer: IntersectionObserver | null = null
const handlers = new WeakMap<Element, Handler>()

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        handlers.get(entry.target)?.()
        observer?.unobserve(entry.target)
        handlers.delete(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  )

  return observer
}

export function Reveal({
  children,
  className,
  as: Tag = 'div',
  delayMs = 0,
  id,
}: {
  children: ReactNode
  className?: string
  as?: ElementType
  /** Escalonar elementos hermanos. */
  delayMs?: number
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const show = () => element.setAttribute('data-reveal', 'shown')

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const io = getObserver()
    if (reduce || !io) {
      show()
      return
    }

    handlers.set(element, show)
    io.observe(element)

    return () => {
      io.unobserve(element)
      handlers.delete(element)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal="hidden"
      className={className}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
