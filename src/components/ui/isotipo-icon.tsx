/**
 * El isotipo de Ruralanas —el huso— como ícono. Reemplaza al corazón de
 * favoritos: guardar una pieza es "guardarla en el huso", y la marca dice más
 * que un símbolo genérico.
 *
 * La identidad sólo existe como PNG (`public/isotipo.png`, gris sobre
 * transparente). Se usa como máscara CSS: el ícono toma el color del texto
 * (`currentColor`) y sirve igual sobre fondo claro, oscuro o activo.
 *
 * No bajar de 20px de alto: el huso es trazo fino y por debajo se deshace.
 * Cuando exista el isotipo en SVG, se cambia la máscara y nada más.
 */

const RATIO = 132 / 278

export function IsotipoIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: Math.round(size * RATIO),
        height: size,
        maskImage: 'url(/isotipo.png)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: 'url(/isotipo.png)',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
