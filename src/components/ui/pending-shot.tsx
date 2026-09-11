/**
 * Marco punteado para el material que todavía no existe: fotos, ilustraciones,
 * sellos y el mapa. Es el recurso del prototipo y conviene conservarlo — deja
 * a la vista qué falta producir (módulo 08) en vez de disimularlo con una
 * imagen de archivo.
 */

const TONES = {
  dark: {
    border: 'rgba(143,134,122,.4)',
    stripe: 'repeating-linear-gradient(125deg,#211b16 0 22px,#1a1611 22px 44px)',
    text: 'text-stone',
  },
  light: {
    border: '#8F867A',
    stripe:
      'repeating-linear-gradient(135deg,rgba(143,134,122,.14) 0 30px,rgba(143,134,122,.05) 30px 60px)',
    text: 'text-stone',
  },
  warm: {
    border: 'rgba(20,17,14,.4)',
    stripe:
      'repeating-linear-gradient(120deg,rgba(20,17,14,.12) 0 26px,rgba(20,17,14,.04) 26px 52px)',
    text: 'text-ink',
  },
} as const

export function PendingShot({
  label,
  ratio = '4/5',
  tone = 'dark',
  align = 'end',
  className = '',
}: {
  label: string
  ratio?: string
  tone?: keyof typeof TONES
  align?: 'center' | 'end'
  className?: string
}) {
  const style = TONES[tone]

  return (
    <div
      className={`flex border border-dashed p-3.5 ${
        align === 'center' ? 'items-center justify-center text-center' : 'items-end'
      } ${className}`}
      style={{
        aspectRatio: ratio,
        borderColor: style.border,
        background: style.stripe,
      }}
    >
      <span className={`font-mono text-[11px] ${style.text}`}>[ {label.toUpperCase()} ]</span>
    </div>
  )
}
