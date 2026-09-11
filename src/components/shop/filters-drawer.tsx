'use client'

/**
 * En móvil el sidebar no entra: los filtros pasan a un panel que se abre desde
 * abajo. El prototipo no resolvía la tienda en móvil y es donde llega la mayor
 * parte del tráfico.
 */

import { useEffect, useState, type ReactNode } from 'react'

export function FiltersDrawer({
  label,
  closeLabel,
  activeCount,
  children,
}: {
  label: string
  closeLabel: string
  activeCount: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-sm border border-ink/30 px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink uppercase"
      >
        {label}
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-merlot px-1 text-[10px] text-linen">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-pointer bg-carbon/70"
          />
          <div className="relative max-h-[85vh] overflow-y-auto rounded-t-xl bg-linen-soft px-6 pb-8 pt-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-2xl text-ink">{label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="cursor-pointer p-1 text-ink"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 5l14 14" />
                  <path d="M19 5L5 19" />
                </svg>
              </button>
            </div>
            <div onClick={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      )}
    </div>
  )
}
