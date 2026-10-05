'use client'

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

/**
 * Desplegable de la barra de la tienda.
 *
 * La base es `<details>`: abre y cierra con clic y teclado sin JavaScript, igual
 * que el resto de la tienda, que son todos enlaces. Encima se suma:
 *
 * - Hover en dispositivos con mouse, con demora al abrir y al cerrar. Sin ella
 *   el menú salta cada vez que el puntero cruza la barra, y se cierra cuando
 *   baja en diagonal hacia una opción. En pantallas táctiles no hay hover y
 *   queda el clic.
 * - Cierre con Escape, con clic afuera y al elegir una opción.
 *
 * Todos comparten `name`: abrir uno cierra el otro.
 */

const OPEN_DELAY_MS = 120
const CLOSE_DELAY_MS = 300

export function ToolbarMenu({
  label,
  active = false,
  align = 'start',
  children,
}: {
  label: ReactNode
  /** Hay algo elegido dentro: el botón se rellena para que se note sin abrirlo. */
  active?: boolean
  align?: 'start' | 'end'
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const timer = useRef<number | undefined>(undefined)
  // Si lo abrió el hover, el clic que suele venir después no tiene que cerrarlo.
  const openedByHover = useRef(false)

  useEffect(() => {
    const details = ref.current
    if (!details) return

    const onPointerDown = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) details.open = false
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !details.open) return
      details.open = false
      details.querySelector('summary')?.focus()
    }
    const onToggle = () => {
      if (!details.open) openedByHover.current = false
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    details.addEventListener('toggle', onToggle)
    return () => {
      window.clearTimeout(timer.current)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      details.removeEventListener('toggle', onToggle)
    }
  }, [])

  const schedule = (open: boolean, delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const details = ref.current
      if (!details || details.open === open) return
      if (open) openedByHover.current = true
      details.open = open
    }, delay)
  }

  const onSummaryClick = (event: MouseEvent) => {
    if (openedByHover.current && ref.current?.open) {
      event.preventDefault()
      openedByHover.current = false
    }
  }

  const onPanelClick = (event: MouseEvent) => {
    if ((event.target as Element).closest('a') && ref.current) ref.current.open = false
  }

  return (
    <details
      ref={ref}
      name="shop-toolbar"
      className="group static sm:relative"
      onPointerEnter={(event) => event.pointerType === 'mouse' && schedule(true, OPEN_DELAY_MS)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && schedule(false, CLOSE_DELAY_MS)}
    >
      <summary
        onClick={onSummaryClick}
        className={`flex cursor-pointer list-none items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[11px] tracking-[0.06em] uppercase transition-colors select-none [&::-webkit-details-marker]:hidden ${
          active
            ? 'border-earth bg-earth text-paper'
            : 'border-earth/30 text-earth hover:border-earth group-open:border-earth'
        }`}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </summary>

      {/*
        El `pt-2` es un puente transparente: el puntero pasa del botón al panel
        sin salir del `<details>`, así el hover no lo cierra en el camino. En
        móvil el panel toma el ancho de la barra; desde `sm`, el de su botón.
      */}
      <div
        onClick={onPanelClick}
        className={`absolute inset-x-0 top-full z-10 px-[var(--spacing-gutter)] pt-2 sm:inset-x-auto sm:w-72 sm:px-0 ${
          align === 'end' ? 'sm:right-0' : 'sm:left-0'
        }`}
      >
        <div className="rounded-sm border border-earth/12 bg-paper p-3 shadow-[0_18px_40px_-20px_rgba(45,35,25,0.35)]">
          {children}
        </div>
      </div>
    </details>
  )
}
