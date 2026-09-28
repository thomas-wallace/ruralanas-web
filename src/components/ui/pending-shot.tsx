/**
 * Lugar reservado para el material que todavía no existe: fotos, el video del
 * local, las tomas de la ficha.
 *
 * Se ve como un color liso, sin rayas, sin borde punteado y sin texto: todo
 * eso se leía como sitio en construcción, y lo mismo aparecía un instante
 * mientras cargaba una foto de verdad. Qué falta producir sigue a mano para
 * quien mantiene el sitio: está en `data-pending` y en `title`.
 */

const TONES = {
  dark: 'bg-[#1a1611]',
  light: 'bg-ash/60',
  warm: 'bg-shell',
} as const

export function PendingShot({
  label,
  ratio = '4/5',
  tone = 'dark',
  className = '',
}: {
  label: string
  ratio?: string
  tone?: keyof typeof TONES
  /** Se conserva por compatibilidad con los usos existentes; ya no hay texto que alinear. */
  align?: 'center' | 'end'
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      data-pending={label}
      title={label}
      className={`${TONES[tone]} ${className}`}
      style={{ aspectRatio: ratio }}
    />
  )
}
