'use client'

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react'

import type { Money } from '@/lib/catalog/types'
import {
  CURRENCY_COOKIE,
  isDisplayCurrency,
  toDisplay,
  type DisplayCurrency,
  type Rates,
} from '@/lib/currency/config'
import { formatPrice } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'

/**
 * Moneda de la vidriera, del lado del navegador.
 *
 * Las páginas son estáticas, así que el servidor no sabe desde dónde se las
 * mira: renderiza dólares, y al hidratar se lee la cookie que dejó el
 * middleware. `useSyncExternalStore` hace ese cambio sin error de hidratación.
 */

interface CurrencyState {
  currency: DisplayCurrency
  rates: Rates
  setCurrency: (currency: DisplayCurrency) => void
}

const CurrencyContext = createContext<CurrencyState>({
  currency: 'USD',
  rates: null,
  setCurrency: () => {},
})

const listeners = new Set<() => void>()

function readCookie(): DisplayCurrency {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]+)`))
  const value = match?.[1]
  return isDisplayCurrency(value) ? value : 'USD'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function CurrencyProvider({ rates, children }: { rates: Rates; children: ReactNode }) {
  const cookie = useSyncExternalStore(subscribe, readCookie, () => 'USD' as const)
  // Sin cotización no hay euros ni libras que mostrar.
  const currency = rates ? cookie : 'USD'

  const setCurrency = useCallback((next: DisplayCurrency) => {
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    listeners.forEach((listener) => listener())
  }, [])

  return (
    <CurrencyContext.Provider value={{ currency, rates, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyState {
  return useContext(CurrencyContext)
}

/** Formateador ya atado a la moneda de la vidriera. */
export function useFormatPrice(locale: Locale): (money: Money) => string {
  const { currency, rates } = useCurrency()
  return (money) => formatPrice(toDisplay(money, currency, rates), locale)
}

/** Precio en la moneda de la vidriera. Sirve también dentro de componentes de servidor. */
export function Price({ money, locale }: { money: Money; locale: Locale }) {
  const format = useFormatPrice(locale)
  return <>{format(money)}</>
}
