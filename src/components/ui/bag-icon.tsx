/**
 * Bolsa de compras. La misma silueta en el header (carrito) y en las tarjetas
 * (agregado rápido), para que se lea como un solo gesto: "esto va a la bolsa".
 */
export function BagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}
