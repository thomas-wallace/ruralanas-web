import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Product } from '@/lib/catalog/types'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { routes } from '@/lib/routes'

/**
 * Bloque "Proceso" de la ficha, debajo de la descripción: horas de trabajo,
 * técnica y talleres que intervienen.
 *
 * Cada dato se muestra sólo si existe (ver `content/product-process.ts`): una
 * cifra estimada sería un argumento de venta falso. Si no hay ninguno, el
 * bloque no se dibuja.
 */

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

/** Reloj: las horas de trabajo a mano. */
const ClockIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

/** Ovillo con agujas: la técnica de tejido. */
const YarnIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="10.5" cy="13.5" r="6.5" />
    <path d="M5 10.5c3 .5 7.5 3 9.5 7.5M7.5 7.8c3.5 1.2 7 5 8 9.5M4.6 15c2.5-.2 5 1 6.5 4.2" />
    <path d="m15.5 8.5 5-5M17.5 9.5l3.5-3.5" />
  </svg>
)

/** Casa: cada taller es la casa de una artesana. */
const HouseIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 11 12 4.5l8 6.5" />
    <path d="M6 9.5V19.5h12V9.5" />
    <path d="M10 19.5v-5h4v5" />
  </svg>
)

export function ProcessFacts({
  product,
  locale,
  dict,
}: {
  product: Product
  locale: Locale
  dict: Dictionary
}) {
  const facts: { key: string; icon: ReactNode; value: string; label: string }[] = []

  if (product.handworkHours) {
    facts.push({
      key: 'hours',
      icon: <ClockIcon />,
      value: String(product.handworkHours),
      label: dict.product.hours,
    })
  }
  if (product.technique) {
    facts.push({
      key: 'technique',
      icon: <YarnIcon />,
      value: dict.techniques[product.technique],
      label: dict.product.technique,
    })
  }
  if (product.workshops) {
    facts.push({
      key: 'workshops',
      icon: <HouseIcon />,
      value: String(product.workshops),
      label: product.workshops === 1 ? dict.product.workshop : dict.product.workshops,
    })
  }

  if (facts.length === 0) return null

  return (
    <section aria-labelledby="process-facts" className="mt-7 border-y border-earth/12 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="process-facts"
          className="m-0 font-sans text-[11px] font-normal tracking-[0.2em] text-olive uppercase"
        >
          {dict.product.processEyebrow}
        </h2>
        <Link
          href={routes.about(locale, 'procesos')}
          className="font-sans text-[11px] tracking-[0.08em] text-slate underline underline-offset-4 transition-colors hover:text-olive"
        >
          {dict.product.processLink} →
        </Link>
      </div>

      <dl className="m-0 mt-4 grid grid-cols-3 gap-4">
        {facts.map((fact) => (
          // El rótulo va primero en el DOM, como pide `dl`, y abajo en pantalla.
          <div key={fact.key} className="flex flex-col gap-2">
            <dt className="order-last font-sans text-[10px] leading-snug tracking-[0.12em] text-slate uppercase">
              {fact.label}
            </dt>
            <dd className="m-0 flex flex-col gap-2">
              <span className="text-olive">{fact.icon}</span>
              <span className="font-display text-[22px] leading-none text-earth">{fact.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
