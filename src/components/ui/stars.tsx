/**
 * Estrellas de una reseña.
 *
 * Se redondea a media estrella para no mentir con el promedio: un 4,6 no puede
 * dibujarse como cinco estrellas llenas. El valor exacto va siempre en el
 * `aria-label`, que es lo que lee un lector de pantalla.
 */
export function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2

  return (
    <div
      className={`flex gap-0.5 font-mono text-[13px] leading-none text-bronze ${className}`}
      role="img"
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => {
        const opacity = step <= rounded ? '' : step - 0.5 === rounded ? 'opacity-55' : 'opacity-25'
        return (
          <span key={step} aria-hidden="true" className={opacity}>
            ★
          </span>
        )
      })}
    </div>
  )
}
