'use client'

import { displayCurrencies } from '@/lib/currency/config'
import { useCurrency } from './currency-provider'

const LABELS = { USD: 'US$', EUR: '€', GBP: '£' } as const

/**
 * Moneda de la vidriera. La primera visita la fija por país; acá el cliente la
 * cambia si viaja, usa VPN o simplemente prefiere otra.
 *
 * Sin cotización sólo hay dólares, así que no se ofrece lo que no se puede
 * mostrar. La forma (píldora, lista suelta) la decide quien lo usa con
 * `className`, igual que el selector de idioma que tiene al lado.
 */
export function CurrencySwitch({ label, className = '' }: { label: string; className?: string }) {
  const { currency, rates, setCurrency } = useCurrency()
  if (!rates) return null

  return (
    <div role="group" aria-label={label} className={`items-center ${className}`}>
      {displayCurrencies.map((code, index) => (
        <span key={code} className="flex items-center gap-1.5">
          {index > 0 && <span className="opacity-40">·</span>}
          <button
            type="button"
            onClick={() => setCurrency(code)}
            aria-pressed={currency === code}
            className={`cursor-pointer transition-colors ${
              currency === code ? 'text-earth' : 'text-slate hover:text-earth'
            }`}
          >
            {LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  )
}

/** Código de la moneda que se está mostrando, para frases como "Precios en USD". */
export function CurrentCurrency() {
  return <>{useCurrency().currency}</>
}
