import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-[var(--spacing-gutter)] pt-24 text-center">
      <div className="font-mono text-[11px] tracking-[0.2em] text-bronze uppercase">404</div>
      <h1 className="m-0 max-w-[520px] font-display text-[clamp(32px,5vw,60px)] font-medium leading-none text-linen">
        Esta hebra no lleva a ningún lado
      </h1>
      <p className="m-0 max-w-[420px] text-[15px] leading-relaxed text-stone">
        La página que buscás no existe o cambió de dirección.
      </p>
      <Link
        href="/es/tienda"
        className="border-b border-bronze pb-1 font-mono text-[11px] tracking-[0.1em] text-linen uppercase hover:text-bronze"
      >
        Ir a la tienda →
      </Link>
    </div>
  )
}
