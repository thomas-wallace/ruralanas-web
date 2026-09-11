import type { Availability } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import { interpolate } from '@/lib/format'

/**
 * Estado de stock.
 *
 * "Queda 1" se comunica como pieza única y en color de marca, no como una
 * alerta: es el argumento de venta más fuerte del catálogo. "Agotado" nunca
 * queda como callejón sin salida — siempre hay plazo o aviso de reposición.
 */

const TONE = {
  in_stock: 'border-stone/40 text-stone',
  last_one: 'border-merlot bg-merlot text-linen',
  made_to_order: 'border-bronze text-bronze',
  sold_out: 'border-stone/40 text-stone',
} as const

export function availabilityLabel(availability: Availability, dict: Dictionary): string {
  const base = dict.availability[availability.state]
  if (availability.state === 'made_to_order' && availability.leadTimeDays) {
    return `${base} · ${interpolate(dict.availability.leadTime, { n: availability.leadTimeDays })}`
  }
  return base
}

export function AvailabilityBadge({
  availability,
  dict,
  className = '',
}: {
  availability: Availability
  dict: Dictionary
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] uppercase ${TONE[availability.state]} ${className}`}
    >
      {availabilityLabel(availability, dict)}
    </span>
  )
}
