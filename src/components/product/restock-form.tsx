'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { requestRestockAlert, type FormState } from '@/lib/leads/actions'
import type { Dictionary } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/config'

const INITIAL: FormState = { status: 'idle' }

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer bg-ink px-5 py-3 font-mono text-[11px] tracking-[0.1em] text-linen uppercase transition-colors hover:bg-merlot disabled:opacity-60"
    >
      {pending ? '…' : label}
    </button>
  )
}

/**
 * Agotado sin callejón sin salida: en vez de un botón muerto, se recoge el
 * email. Ese lead entra al CRM con el slug del producto, que es lo que después
 * permite avisar cuando el ERP reponga stock.
 */
export function RestockForm({
  slug,
  locale,
  dict,
}: {
  slug: string
  locale: Locale
  dict: Dictionary
}) {
  const [state, action] = useActionState(requestRestockAlert, INITIAL)

  if (state.status === 'ok') {
    return (
      <p role="status" className="m-0 font-mono text-xs text-merlot">
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productSlug" value={slug} />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`restock-${slug}`}>
          {dict.product.notifyPlaceholder}
        </label>
        <input
          id={`restock-${slug}`}
          name="email"
          type="email"
          required
          placeholder={dict.product.notifyPlaceholder}
          className="flex-1 border border-ink/30 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-stone focus:border-merlot focus:outline-none"
        />
        <Submit label={dict.product.notifyCta} />
      </div>
      {state.status === 'error' && (
        <p role="alert" className="m-0 font-mono text-xs text-merlot-bright">
          {state.message}
        </p>
      )}
    </form>
  )
}
