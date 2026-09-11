'use client'

/**
 * Selector de color.
 *
 * Once de los dieciocho productos publicados son variables por color, con
 * hasta doce opciones. Sin este paso el botón de comprar no puede funcionar:
 * el SKU del padre no es comprable, se compra la variación.
 *
 * Se elige de forma explícita, sin preselección: en una pieza artesanal el
 * color no es un detalle configurable, es qué prenda se lleva. Preseleccionar
 * la primera hace que la gente compre un color que no eligió.
 */

import { swatchFor } from '@/lib/catalog/colors'
import type { ProductVariant } from '@/lib/catalog/types'

export function VariantPicker({
  variants,
  selected,
  onSelect,
  label,
  disabled = false,
}: {
  variants: ProductVariant[]
  selected: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
  label: string
  disabled?: boolean
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2.5 p-0 font-mono text-[11px] tracking-[0.14em] text-graphite uppercase">
        {label}
        {selected && <span className="ml-2 normal-case tracking-normal text-ink">{selected.colorName}</span>}
      </legend>

      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const swatch = swatchFor(variant.colorSlug)
          const active = selected?.commerceId === variant.commerceId

          return (
            <button
              key={variant.commerceId}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(variant)}
              aria-pressed={active}
              title={variant.colorName}
              className={`flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'border-merlot bg-merlot/6' : 'border-ink/20 hover:border-ink/50'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full border border-ink/20"
                style={swatch ? { backgroundColor: swatch } : undefined}
              />
              <span className="text-[13px] text-ink">{variant.colorName}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
