import Image from 'next/image'

/**
 * El huso del logo, muy tenue, detrás del contenido.
 *
 * Tres reglas que conviene no romper al agregar un uso nuevo:
 *
 *  1. **Poca cantidad.** Una vez en el cuerpo de cada página de Nosotros
 *     (ver `accentIndex` en `content-blocks.tsx`), en la portada de cada
 *     sección y en el encabezado de la tienda. Una marca de agua que aparece
 *     en cada bloque deja de ser un gesto y pasa a ser papel tapiz. El bloque
 *     `cta`, que se repite en todas las secciones, no la lleva.
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
