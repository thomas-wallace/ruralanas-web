import Image from 'next/image'

/**
 * El huso del logo, muy tenue, detrás del contenido.
 *
 * Tres reglas que conviene no romper al agregar un uso nuevo:
 *
 *  1. **Poca cantidad.** Va en tres lugares de Nosotros y en ninguno más. Una
 *     marca de agua que aparece en cada bloque deja de ser un gesto y pasa a
 *     ser papel tapiz. La tentación es el bloque `cta`, que se repite en
 *     cuatro secciones: ahí justamente no va.
 *  2. **Grande o nada.** El huso es casi todo trazo fino; por debajo de unos
 *     250px de alto se deshace y se lee como suciedad en el fondo.
 *  3. **Nunca sobre una foto.** Compite y ensucia. Sólo sobre fondo liso.
 *
 * La opacidad por defecto es para `paper`. Sobre `ash`, que es más oscuro y
 * deja menos margen, hace falta un punto más: se pasa por `className`.
 *
 * El logo va en su gris, sin teñir, como en todos lados.
 */
export function Watermark({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/isotipo.png"
      alt=""
      aria-hidden
      width={132}
      height={278}
      // Decorativa: no debe recibir clics ni quedar seleccionada al arrastrar.
      className={`pointer-events-none absolute -z-10 w-auto select-none opacity-[0.07] ${className}`}
    />
  )
}
