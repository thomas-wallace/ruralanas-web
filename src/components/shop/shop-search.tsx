'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'
import { shopHref, type ShopParams } from '@/lib/shop-params'

/**
 * Buscador de la tienda.
 *
 * El texto vive en la URL (`?q=`) como el resto de los filtros: la búsqueda se
 * comparte, el servidor devuelve la grilla ya filtrada y busca dentro de la
 * categoría elegida. Con JavaScript filtra mientras se escribe; sin él, es un
 * formulario GET que arrastra los demás filtros en campos ocultos.
 */

const TYPING_DELAY_MS = 300

export function ShopSearch({
  locale,
  dict,
  params,
  className = '',
}: {
  locale: Locale
  dict: Dictionary
  params: ShopParams
  className?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [value, setValue] = useState(params.q ?? '')
  // Lo último que se pidió, no lo que dice la URL: mientras una búsqueda está
  // en camino la URL va un paso atrás, y borrar en ese momento se perdía.
  const requested = useRef(params.q)
  const [pending, startTransition] = useTransition()

  // Si la URL cambia por otro lado (limpiar filtros, volver atrás), el campo la
  // sigue. Mientras se escribe no: la URL va un paso atrás y pisaría lo tecleado.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return
    requested.current = params.q
    setValue(params.q ?? '')
  }, [params.q])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const search = (text: string) => {
    window.clearTimeout(timer.current)
    const q = text.trim() || undefined
    if (q === requested.current) return
    requested.current = q
    startTransition(() => {
      router.replace(shopHref(locale, params, { q }), { scroll: false })
    })
  }

  const onChange = (text: string) => {
    setValue(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => search(text), TYPING_DELAY_MS)
  }

  const clear = () => {
    setValue('')
    search('')
    inputRef.current?.focus()
  }

  // Los demás filtros, para el envío sin JavaScript.
  const carried = [...new URLSearchParams(shopHref(locale, params, { q: undefined }).split('?')[1])]

  return (
    <form
      role="search"
      action={`/${locale}/tienda`}
      method="get"
      onSubmit={(event) => {
        event.preventDefault()
        search(value)
      }}
      className={`relative flex items-center ${className}`}
    >
      {carried.map(([name, carriedValue]) => (
        <input key={name} type="hidden" name={name} value={carriedValue} />
      ))}

      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
        className={`pointer-events-none absolute left-3 text-slate transition-opacity ${pending ? 'animate-pulse' : ''}`}
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
      </svg>

      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            clear()
          }
        }}
        placeholder={dict.shop.searchPlaceholder}
        aria-label={dict.shop.search}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={80}
        className="h-[34px] w-full rounded-sm border border-earth/30 bg-transparent pr-8 pl-9 text-base text-earth sm:text-[13px] transition-colors placeholder:text-slate hover:border-earth/60 focus:border-earth focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />

      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label={dict.shop.clearSearch}
          className="absolute right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center text-slate transition-colors hover:text-earth"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      )}
    </form>
  )
}
