/**
 * Botón de compra: un solo diseño para la tarjeta del listado, la fila de la
 * vista lista y la ficha de producto.
 *
 * Dos variantes, con la misma regla en todas partes:
 *   · `primary` (relleno tierra): la acción que agrega al carrito.
 *   · `secondary` (contorno): la que todavía no puede agregar y lleva a otro
 *     paso —elegir color, avisarme—.
 * Cambia sólo el tamaño: `md` en la ficha, `sm` en los listados.
 *
 * Es una función de clases y no un componente porque el mismo aspecto lo llevan
 * un `<button>` y un `<Link>`.
 */

export type ButtonVariant = 'primary' | 'secondary'
export type ButtonSize = 'sm' | 'md'

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 font-sans uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 py-2.5 text-[10px] tracking-[0.14em]',
  md: 'min-h-13 px-6 py-4 text-[11px] tracking-[0.12em]',
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border border-earth bg-earth text-paper hover:border-olive hover:bg-olive',
  secondary: 'border border-earth/25 bg-transparent text-earth hover:border-olive hover:text-olive',
}

export function buttonClass(
  variant: ButtonVariant,
  size: ButtonSize = 'md',
  extra = '',
): string {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${extra}`.trim()
}
